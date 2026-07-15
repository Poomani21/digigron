async function loadHTML(id,file){

    const element =
    document.getElementById(id);


    const response =
    await fetch(file);


    const data =
    await response.text();


    element.innerHTML=data;


    // after navbar loaded
    import("./header.js");


}



loadHTML(
"navbar",
"components/nav.html"
);