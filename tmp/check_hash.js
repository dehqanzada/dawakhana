import bcrypt from 'bcryptjs';

const password = '1234';
const saltRounds = 10;

async function check() {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`Hash for '1234': ${hash}`);
    
    // Check the hash from the screenshot
    const screenshotHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    const is1234 = await bcrypt.compare('1234', screenshotHash);
    const isPassword = await bcrypt.compare('password', screenshotHash);
    
    console.log(`Does matches '1234'? ${is1234}`);
    console.log(`Does matches 'password'? ${isPassword}`);
}

check();
