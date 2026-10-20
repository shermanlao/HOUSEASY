-- Monthly rent may be left blank when a room is created or edited.
ALTER TABLE "Room" ALTER COLUMN "monthlyRent" DROP NOT NULL;
