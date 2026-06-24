"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../src/data-source");
const user_entity_1 = require("../src/entities/user.entity");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_stub_1 = require("../src/../auth.stub");
async function seed() {
    const ds = await (0, data_source_1.initializeDataSource)();
    const userRepo = ds.getRepository(user_entity_1.User);
    const existing = await userRepo.find();
    if (existing.length > 0) {
        console.log('DB already seeded');
        process.exit(0);
    }
    const password = 'Password123!';
    const hash = await bcryptjs_1.default.hash(password, 10);
    const roles = [auth_stub_1.Role.Supplier, auth_stub_1.Role.PMU_Officer, auth_stub_1.Role.PRAZ_Regulator, auth_stub_1.Role.Public_Observer];
    for (const role of roles) {
        const user = userRepo.create({ email: `${role.toLowerCase()}@example.com`, passwordHash: hash, role });
        await userRepo.save(user);
        console.log('Created user', user.email, 'with password:', password);
    }
    process.exit(0);
}
seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
