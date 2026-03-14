"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function seed() {
    console.log('🌱 Seeding Phoneix Business Suite v1.2.0...');
    // ── Admin User ──────────────────────────────────────────────
    const adminPassword = await bcrypt_1.default.hash('Admin@1234', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@phoneix.com' },
        update: {},
        create: {
            email: 'admin@phoneix.com',
            password: adminPassword,
            name: 'System Admin',
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin user:', admin.email);
    // ── Default Settings ────────────────────────────────────────
    const settings = [
        { key: 'business_name', value: 'Phoneix Business Suite' },
        { key: 'business_address', value: '123 Main Street, City, State 000000' },
        { key: 'business_phone', value: '+91 9999999999' },
        { key: 'business_email', value: 'info@phoneix.com' },
        { key: 'gst_number', value: 'GSTIN0000000000' },
        { key: 'invoice_prefix', value: 'INV' },
        { key: 'default_tax', value: '18' },
        { key: 'currency', value: 'INR' },
        { key: 'currency_symbol', value: '₹' },
        { key: 'timezone', value: 'Asia/Kolkata' },
        { key: 'receipt_footer', value: 'Thank you for your business! For queries contact us at the number above.' },
        // WhatsApp / Meta API — disabled by default
        { key: 'meta_api_enabled', value: '0' },
        { key: 'whatsapp_phone', value: '' },
        { key: 'whatsapp_message_template_invoice', value: '' },
        { key: 'whatsapp_message_template_repair', value: '' },
    ];
    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: {},
            create: s,
        });
    }
    console.log('✅ Settings seeded');
    console.log('\n🎉 Seeding complete!');
    console.log('\n📋 Default credentials:');
    console.log('   Email:    admin@phoneix.com');
    console.log('   Password: Admin@1234');
    console.log('\n   ⚠️  Change the default password after first login!');
}
seed()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seed.js.map