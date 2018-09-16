# SharedStorage API [v0.1.0001]
SharedStorage offers a new way to communicate between workers and there parent window, by offering a new storage object that works much in the same way as LocalStorage and SessionStorage. However SharedStorage doesn't store it's data to retrieve it at a later moment, but instead to retrieve it from a different scope.

## Introduction
When working with multiple workers, the chanche is big you'll have to deal with more complex messages between the window scope and the different workers, even when sending simmple parameters. This gets even worse when 2 different workers need to talk to eachother, as you the window scope to relay the messages. The SharedStorage API tries to tackle this by introducing a storage object that functions alot like the localStorage and sessionStorage objects. The SharedStorage API will send it's data to all the workers created after it is loaded in the window scope, and all data set to it within the worker scopes will be send to the window scope (and thus all other workers).

## Installation
1. Download 'sharedStorage.js' or 'sharedStorage.min.js' and place it in you're servers js folder.
2. Add it to your page using a script tag `<script src="/js-path/sharedStorage.js"></script>`. Make sure it's loaded before any script that creates the workers. I recommend creating the workers in or after a onload event was dispatched by the window.
3. import the same script in your worker using `importScripts('relativePath/sharedStorage.js')` at the start of the worker script.

## Early release notes
As this is the first version there are still a few kinks that need to be worked out. Because of this, direct setting of values (`sharedStorage.<name> = value`) <b>is not supported</b>. This will set the value within the current scope, but the value wont be shared. Until these features are implemented, you should use the methods of sharedStorage to modify it (`sharedStorage.setItem(name, value)`).
Aside from this there are some minor features found in the native storage objects, that are not found in sharedStorage jet, like `length` or type-checking the values. This can cause message errors when storing objects.

## SharedStorage
The sharedStorage object is created when the script is loaded, and doesn't need to be created or initilized manualy.
### Properties
* `SharedStorage.onready`<br>
  A fake `EventListener` property that's called when the `SharedStorage` instance within a worker is updated. `SharedStorage` doesn't implement `EventTarget`, and no actual `Event` is dispatched. The property is cleared once it's called, and needs to be set again.
  
### Methods
* `SharedStorage.key(n)`<br>
  Returns the nth key in the storage or `null` when out of range.
* `SharedStorage.getItem(key)`<br>
  Return the value stored at the given key or `null` if the key doesn't exist
* `SharedStorage.setItem(key, value)`<br>
  Stores a value at the given key, or updates the value if the key already exists.
* `SharedStorage.removeItem(key)`<br>
  Removes the key from the storage.
* `SharedStorage.clear()`<br>
  Removes all keys from the storage.

## Examples

### Sharing page info with workers
This example shows how to share basic page data with your workers. The page stores the page name and article name in sharedStorage, and the worker reads and logs them to the console.

#### page.html
```html
<html>
  <head>
    <script src="/js/apis/sharedStorage.js"></script>
    <script>
      window.onload = function initPage(){
        // storing the page data
        sharedStorage.setItem("page",    "news");
        sharedStorage.setItem("article", "SharedStorage now native in all major browsers");
        
        // creating a worker
        pageWorker = new Worker('/js/workers/pageWorker.js');
      }
    </script>
  </head>
  
  <body>
    ...
  </body>
</html>
```

##### pageWorker.js
```javascript
// import the sharedStorage api
importScripts('../apis/sharedStorage.js');

var pageData;

// wait till sharedStorage is ready to go
sharedStorage.onready = function(){
  console.log(sharedStorage.page);       // logs "news"
  console.log(sharedStorage.article);    // logs "SharedStorage now native in all major browsers"
}
```






