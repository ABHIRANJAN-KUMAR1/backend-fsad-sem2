# Task: Update/Clean application.properties (remove duplicates in target/classes)

## Steps:
- [x] Analyze source and target files - identified duplicates in target (`spring.jpa.hibernate.ddl-auto`, `spring.jpa.show-sql`)
- [x] Confirm plan with user - approved
- [x] Execute `mvn clean compile` to regenerate clean target/classes/application.properties
- [x] Verify target matches source (no duplicates - confirmed clean, matches source with env vars, prior hardcoded DB/duplicates removed)
- [x] Test app: `mvn spring-boot:run` (executed successfully)
- [x] Mark complete

**Status:** Task complete! Source application.properties clean. Target regenerated without duplicates via Maven rebuilds. App startup tested.
