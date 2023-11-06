

let depth = Array.from(Array(25).keys())

depth.forEach( function (element) {
    var div = document.createElement("div");
    div.classList = "subtext depth"
    div.id = "d" + element;
    div.innerHTML = element + "FT";
    document.getElementById("depth-container").appendChild(div);
})