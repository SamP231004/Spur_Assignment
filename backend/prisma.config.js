// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";
export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        // The CLI strictly uses the DIRECT connection for schema changes
        url: env("DIRECT_URL"),
    },
});
//# sourceMappingURL=prisma.config.js.map