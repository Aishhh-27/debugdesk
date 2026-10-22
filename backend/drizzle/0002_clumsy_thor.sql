CREATE TABLE "incident_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_id" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"author" varchar(100) DEFAULT 'Demo operator' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "incident_notes" ADD CONSTRAINT "incident_notes_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;