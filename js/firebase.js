import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


 // Firebase Configuration (Configured to your project)
        // const firebaseConfig = {
        //     apiKey: "AIzaSyBBVvK-a5fxUlcr2fXhXoZ4RjB49iMpS6A",
        //     authDomain: "my-school-management-sys-c82e6.firebaseapp.com",
        //     projectId: "my-school-management-sys-c82e6",
        //     storageBucket: "my-school-management-sys-c82e6.firebasestorage.app",
        //     messagingSenderId: "712033170172",
        //     appId: "1:712033170172:web:1839d8d238b7ce08c85d79",
        //     measurementId: "G-7B4EPCVN26"
        // };
        const firebaseConfig = {
            apiKey: "AIzaSyAYOzQ-pX-5pXBUnxyhDOn8xoJ5DUj2y6o",
            authDomain: "digigron-d8f6f.firebaseapp.com",
            projectId: "digigron-d8f6f",
            storageBucket: "digigron-d8f6f.firebasestorage.app",
            messagingSenderId: "643414873706",
            appId: "1:643414873706:web:ee78812678b40ea2021c13",
            measurementId: "G-5T87E1TS5H"
        };
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);