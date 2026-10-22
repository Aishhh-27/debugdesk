CREATE TABLE "incidents" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"category" varchar(100) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"status" varchar(30) NOT NULL,
	"endpoint" varchar(200) NOT NULL,
	"error" text NOT NULL,
	"diagnosis" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
