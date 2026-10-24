import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function error(message) {
  errors.push(message);
}

async function read(path) {
  return readFile(join(root, path), "utf8");
}

async function readJson(path) {
  return JSON.parse(await read(path));
}

async function exists(path) {
  try {
    await stat(join(root, path));
    return true;
  } catch {
    return false;
  }
}

const [campaignCatalog, membershipCatalog, contractsSource, migration, envExample, rlsTest, rlsRunner, deploySafe] = await Promise.all([
  readJson("data/marketingCampaigns.json"),
  readJson("data/membershipPlans.json"),
  read("lib/marketing/contracts.ts"),
  read("supabase/migrations/20260809132835_loom_marketing_platform.sql"),
  read(".env.example"),
  read("supabase/tests/database/loom_marketing_rls.integration.sql"),
  read("scripts/test-marketing-rls.mjs"),
  read("scripts/deploy-safe.mjs")
]);

if (campaignCatalog.schemaVersion !== "loom-marketing-campaign-catalog.v1") error("Campaign catalog schema version is invalid.");
if (!Array.isArray(campaignCatalog.campaigns) || campaignCatalog.campaigns.length < 3) error("At least three campaign entries are required.");

const campaignIds = new Set();
const campaignSlugs = new Set();
const touchpointIds = new Set();
for (const campaign of campaignCatalog.campaigns ?? []) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(campaign.id ?? "")) error(`Invalid campaign id: ${campaign.id}`);
  if (campaignIds.has(campaign.id)) error(`Duplicate campaign id: ${campaign.id}`);
  campaignIds.add(campaign.id);
  if (campaignSlugs.has(campaign.slug)) error(`Duplicate campaign slug: ${campaign.slug}`);
  campaignSlugs.add(campaign.slug);
  if (touchpointIds.has(campaign.touchpointId)) error(`Duplicate touchpoint id: ${campaign.touchpointId}`);
  touchpointIds.add(campaign.touchpointId);
  if (!campaign.audience || !campaign.promise || !campaign.message) error(`${campaign.id} is missing audience, promise, or message.`);
  if (!Array.isArray(campaign.proof) || campaign.proof.length < 3) error(`${campaign.id} needs at least three evidence-bounded proof rows.`);
  for (const cta of [campaign.primaryCta, campaign.secondaryCta]) {
    if (!cta?.href?.startsWith("/")) error(`${campaign.id} CTA must use a local path.`);
  }
  if (!campaign.hero?.image?.startsWith("/assets/") || !(await exists(`public${campaign.hero.image}`))) {
    error(`${campaign.id} hero image does not resolve under public assets.`);
  }
  if (!migration.includes(`'${campaign.touchpointId}', '${campaign.id}'`)) {
    error(`${campaign.id} touchpoint is not seeded in the migration.`);
  }
}

if (membershipCatalog.schemaVersion !== "loom-membership-plan-catalog.v1") error("Membership catalog schema version is invalid.");
if (membershipCatalog.paymentsEnabled !== false) error("Membership catalog must keep paymentsEnabled false.");
if (!Array.isArray(membershipCatalog.plans) || membershipCatalog.plans.length < 3) error("Membership catalog needs three plan states.");
for (const plan of membershipCatalog.plans ?? []) {
  if (plan.billingEnabled !== false) error(`${plan.key} must keep billingEnabled false.`);
  if (/buy|checkout|subscribe now/i.test(`${plan.description} ${plan.priceDisplay}`)) error(`${plan.key} contains active-purchase language.`);
  if (!migration.includes(`'${plan.key}'`)) error(`${plan.key} is not constrained in the membership migration.`);
}

const eventMatch = contractsSource.match(/export const marketingEventNames = \[([\s\S]*?)\] as const;/);
if (!eventMatch) error("Marketing event enum could not be read.");
const eventNames = eventMatch ? [...eventMatch[1].matchAll(/"([a-z_]+)"/g)].map((match) => match[1]) : [];
if (eventNames.length < 14 || new Set(eventNames).size !== eventNames.length) error("Marketing event enum is incomplete or duplicated.");
for (const eventName of eventNames) {
  if (!migration.includes(`'${eventName}'`)) error(`Migration does not constrain event ${eventName}.`);
}

const propertyMatch = contractsSource.match(/export const marketingPropertyKeys = \[([\s\S]*?)\] as const;/);
if (!propertyMatch) error("Marketing property key enum could not be read.");
const propertyKeys = propertyMatch ? [...propertyMatch[1].matchAll(/"([a-z_]+)"/g)].map((match) => match[1]) : [];
if (propertyKeys.length < 9 || new Set(propertyKeys).size !== propertyKeys.length) {
  error("Marketing property key enum is incomplete or duplicated.");
}
for (const propertyKey of propertyKeys) {
  if (!migration.includes(`'${propertyKey}'`)) error(`Migration does not constrain property key ${propertyKey}.`);
}

const requiredTables = [
  "loom_campaign_touchpoints",
  "loom_marketing_events",
  "loom_fan_profiles",
  "loom_marketing_consents",
  "loom_follows",
  "loom_business_inquiries",
  "loom_membership_interests",
  "loom_experiment_assignments"
];
for (const table of requiredTables) {
  if (!migration.includes(`create table if not exists public.${table}`)) error(`Missing table ${table}.`);
  if (!migration.includes(`alter table public.${table} enable row level security`)) error(`RLS is not enabled for ${table}.`);
  if (!migration.includes(`revoke all on public.${table} from anon, authenticated`)) error(`Least-privilege revoke is missing for ${table}.`);
}

for (const invariant of [
  "private.loom_staff_users",
  "public.loom_is_staff()",
  "public.loom_record_marketing_event",
  "public.loom_save_fan_profile",
  "public.loom_submit_business_inquiry",
  "public.loom_marketing_summary",
  "(select auth.uid())",
  "on conflict (user_id, idempotency_key) do nothing",
  "jsonb_object_keys(p_properties)",
  "LOOM_PROPERTIES_UNSAFE"
]) {
  if (!migration.includes(invariant)) error(`Migration security invariant is missing: ${invariant}`);
}

if (/grant\s+(?:all|insert|update|delete)[^;]+\s+to\s+anon/i.test(migration)) error("Mutation privileges must never be granted to anon.");
if (/service[_-]?role/i.test(await read("lib/marketing/client.ts"))) error("Browser marketing client must not reference a service role.");
if (/NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|SERVICE|PRIVATE|TOKEN|KEY(?!$))/i.test(envExample.replace("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ""))) {
  error("Public environment example appears to expose a sensitive server variable.");
}
if (!envExample.includes("NEXT_PUBLIC_LOOM_MARKETING_MODE=preview")) error("Marketing mode must default to preview in .env.example.");

for (const invariant of [
  "LOOM_MARKETING_RLS_INTEGRATION_PASS",
  "user B cannot read user A profile",
  "direct RPC rejects a PII property key",
  "rollback;"
]) {
  if (!rlsTest.includes(invariant)) error(`Database integration test invariant is missing: ${invariant}`);
}

for (const invariant of [
  "LOOM_SUPABASE_TEST_PROJECT_REF",
  "LOOM_SUPABASE_PRODUCTION_PROJECT_REF",
  'join(root, "supabase", ".temp", "project-ref")',
  'linkedRef !== expectedRef',
  '["db", "query", "--linked", "--file", testFile'
]) {
  if (!rlsRunner.includes(invariant)) error(`Database integration runner safety invariant is missing: ${invariant}`);
}

for (const deployEntry of ['".env.example"', '"docs"', '"lib"', '"supabase"', '"proxy.ts"']) {
  if (!deploySafe.includes(deployEntry)) error(`Safe preview deploy is missing staged entry ${deployEntry}.`);
}

if (!(await exists("proxy.ts"))) {
  error("Safe preview deploy entry proxy.ts does not exist.");
}

const requiredRoutes = [
  "app/campaign/[slug]/page.tsx",
  "app/share/[memberCode]/[optionKey]/page.tsx",
  "app/fan/page.tsx",
  "app/business/page.tsx",
  "app/studio/page.tsx",
  "app/membership/page.tsx",
  "app/api/marketing/events/route.ts",
  "app/api/marketing/profile/route.ts",
  "app/api/marketing/inquiries/route.ts",
  "app/api/marketing/membership-interest/route.ts",
  "app/api/marketing/summary/route.ts",
  "app/api/membership/checkout/route.ts"
];
for (const path of requiredRoutes) {
  if (!(await exists(path))) error(`Required route is missing: ${path}`);
}

const checkoutSource = await read("app/api/membership/checkout/route.ts");
if (!checkoutSource.includes("PAYMENTS_DISABLED") || !checkoutSource.includes("409")) {
  error("Checkout boundary must always return PAYMENTS_DISABLED with a conflict status.");
}

if (errors.length) {
  console.error(`Marketing platform validation failed (${errors.length}):`);
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}

console.log(
  `Marketing platform PASS: ${campaignIds.size} campaigns, ${membershipCatalog.plans.length} non-billing plans, ${eventNames.length} event contracts, ${requiredTables.length} RLS tables, ${requiredRoutes.length} routes.`
);
