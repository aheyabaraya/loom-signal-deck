create index if not exists harne_vote_ballots_option_idx
  on public.harne_vote_ballots (option_id);

create index if not exists harne_chat_threads_unlock_ballot_idx
  on public.harne_chat_threads (unlock_ballot_id);
