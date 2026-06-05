-- Normalize existing district values so dashboards do not split districts by letter case.
-- Safe to run multiple times.

UPDATE `institutes`
SET `district` = UPPER(TRIM(`district`))
WHERE `district` IS NOT NULL
  AND TRIM(`district`) <> '';

UPDATE `students`
SET `district` = UPPER(TRIM(`district`))
WHERE `district` IS NOT NULL
  AND TRIM(`district`) <> '';
