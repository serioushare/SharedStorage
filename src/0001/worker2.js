
importScripts("sharedStorage.js");

sharedStorage.onready = function(){
    sharedStorage.setItem("worker2", "data");
    console.log(sharedStorage);
}
