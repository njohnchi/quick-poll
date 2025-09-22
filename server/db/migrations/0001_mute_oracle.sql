ALTER TABLE "poll_votes" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD COLUMN "voter_token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_poll_votes_voter_token" ON "poll_votes" USING btree ("voter_token");--> statement-breakpoint
CREATE INDEX "idx_polls_closed_at" ON "polls" USING btree ("closed_at");--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "uniq_vote_per_token_per_poll" UNIQUE("voter_token","poll_id");