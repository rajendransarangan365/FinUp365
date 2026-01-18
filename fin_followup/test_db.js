
import axios from 'axios';

async function testBackend() {
    console.log("Testing Backend Connection...");
    try {
        await axios.get('http://localhost:5000/');
        console.log("✅ Server is reachable");
    } catch (e) {
        console.log("❌ Server is NOT reachable:", e.code);
        return;
    }

    console.log("\nTesting OTP Endpoint (DB Check)...");
    try {
        const res = await axios.post('http://localhost:5000/api/auth/send-otp', {
            email: 'test@example.com'
        });
        console.log("✅ OTP Sent (DB Connected)");
    } catch (e) {
        console.log("❌ OTP Failed:");
        if (e.response) {
            console.log("Status:", e.response.status);
            console.log("Data:", e.response.data);
        } else {
            console.log(e.message);
        }
    }
}

testBackend();
