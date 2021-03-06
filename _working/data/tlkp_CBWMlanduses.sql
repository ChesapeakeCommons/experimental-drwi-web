-- SQL Dump of NFWF_step4.accdb
-- generated by MDB Viewer 2.2.5
-- optimized for MySQL

SET NAMES 'UTF8';



DROP TABLE IF EXISTS `tlkp_CBWMlanduses`;

CREATE TABLE `tlkp_CBWMlanduses` (
    `P532_ID` DOUBLE PRIMARY KEY,
    `P532_Landuse_Code` VARCHAR(255),
    `P532_Landuse_Name` VARCHAR(255)
) CHARACTER SET 'UTF8';

INSERT INTO type_8f81139617954313a2e161d64db37cd6("id","code","name","status")
VALUES(1,'hwm','high-till with manure','public'),
      (2,'nhi','high-till with manure nutrient management','public'),
      (3,'hom','high-till without manure','public'),
      (4,'nho','high-till without manure nutrient management','public'),
      (5,'lwm','low-till with manure','public'),
      (6,'nlo','low-till with manure nutrient management','public'),
      (7,'hyw','hay with nutrients','public'),
      (8,'nhy','hay with nutrients nutrient management','public'),
      (9,'alf','alfalfa','public'),
      (10,'nal','alfalfa nutrient management','public'),
      (11,'hyo','hay without nutrients','public'),
      (12,'pas','pasture','public'),
      (13,'npa','pasture nutrient management','public'),
      (14,'trp','pasture corridor','public'),
      (15,'afo','animal feeding operations','public'),
      (16,'urs','nursery','public'),
      (17,'cfo','concentrated animal feeding operations','public'),
      (18,'rcn','regulated construction','public'),
      (19,'ccn','CSS construction','public'),
      (20,'rex','regulated extractive','public'),
      (21,'cex','CSS extractive','public'),
      (22,'nex','nonregulated extractive','public'),
      (23,'for','forest','public'),
      (24,'hvf','harvested forest','public'),
      (25,'rid','regulated impervious developed','public'),
      (26,'nid','nonregulated impervious developed','public'),
      (27,'cid','CSS impervious developed','public'),
      (28,'atdep','atmospheric deposition to non-tidal water','public'),
      (29,'rpd','regulated pervious developed','public'),
      (30,'npd','nonregulated pervious developed','public'),
      (31,'cpd','CSS pervious developed','public'),
      (32,'wwtp','Municipal-waste water treatment plants','public'),
      (33,'septic','septic','public'),
      (34,'cso','combined sewer overflows','public'),
      (35,'indus','Industrial-waste water treatment plants','public');