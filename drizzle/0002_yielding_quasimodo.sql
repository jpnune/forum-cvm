CREATE TABLE "debate_reads" (
	"user_id" text NOT NULL,
	"debate_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "debate_reads_user_id_debate_id_pk" PRIMARY KEY("user_id","debate_id")
);
--> statement-breakpoint
ALTER TABLE "debate_reads" ADD CONSTRAINT "debate_reads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debate_reads" ADD CONSTRAINT "debate_reads_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;