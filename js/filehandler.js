function handleFileSelect(evt) {
  console.log("OKAY");
  evt.stopPropagation();
  evt.preventDefault();

  // Hide the dropzone
  var dz = $("#drop_zone");
  dz.css("border", "none");
  dz.css("background", "none");

  var files;
  if (evt.type == "drop") {
    files = evt.dataTransfer.files; // FileList object.
  } else {
    files = document.getElementById("file").files;
  }

  var reader = new FileReader();
  reader.onload = function() {
    var dataURL = reader.result;
    attachedFile = dataURL;
    var thumb = $("#thumbnail");
    thumb.css("background-image", "url(" + attachedFile + ")");
    thumb.fadeIn("slow", function() {
      $("#close").show();
    });
  };
  reader.readAsDataURL(files[0]);
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = "copy"; // Explicitly show this is a copy.
  var dz = $("#drop_zone");
  dz.css("border", "2px dashed #555");
  dz.css("background", "#ffffffab");
  dz.fadeIn("fast");
}

function handleDragEnd(evt) {
  var dz = $("#drop_zone");
  dz.css("border", "none");
  dz.css("background", "none");
  dz.hide();
}

// Setup the listeners.
function setupDragDropListeners() {
  var dropZone = document.getElementById("drop_zone");
  var container = document.getElementById("container");

  dropZone.addEventListener("dragover", handleDragOver, false);
  dropZone.addEventListener("dragleave", handleDragEnd, false);
  dropZone.addEventListener("drop", handleFileSelect, false);
  dropZone.addEventListener(
    "mouseover",
    function() {
      dropZone.style.display = "none";
    },
    false
  );
  $(document).mouseleave(function() {
    dropZone.style.display = "block";
  });
  $("#file").on("change", handleFileSelect);
}

function bigImg(event) {
  var target = event.target;
  $(target).animate(
    {
      maxHeight: 500,
      maxWidth: "98%"
    },
    scrollDown
  );
}
function normImg(event) {
  var target = event.target;
  $(target).animate({
    maxWidth: 100,
    maxHeight: 70
  });
}

function deleteAtt() {
  attachedFile = null;
  $("#thumbnail").fadeOut();
  $("#close").hide();
}

function mimeTypeOf(encoded) {
  var result = null;

  if (typeof encoded !== "string") {
    return result;
  }

  var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);

  if (mime && mime.length) {
    result = mime[1];
  }

  return result;
}
