CREATE TABLE "incident_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_id" varchar(20) NOT NULL,
	"action" varchar(50) NOT NULL,
	"previous_status" varchar(30),
	"new_status" varchar(30),
	"description" text NOT NULL,
	"actor" varchar(100) DEFAULT 'Demo operator' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "incident_activity" ADD CONSTRAINT "incident_activity_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;