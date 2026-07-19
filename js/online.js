import {
doc,
setDoc,
serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {auth,db} from "./firebase.js";

setInterval(async()=>{

    if(auth.currentUser){

        await setDoc(doc(db,"users",auth.currentUser.uid),{

            lastSeen:serverTimestamp(),

            currentPage:location.pathname,

            online:true

        },{merge:true});

    }

},60000);