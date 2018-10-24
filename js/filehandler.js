// Alina Elena Aldea-Ionescu - 310194
// Joffrey Schneider - 762380

function handleFileSelect(evt) {
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

  // Get the inputfield and save the value for after the upload
  var m = $("#m");
  var oldval = m.val();

  var reader = new FileReader();
  reader.onload = function() {
    m.val(oldval);
    m.prop("disabled", false);
    var dataURL = reader.result;
    attachedFile = dataURL;
    var thumb = $("#thumbnail");
    if (mimeTypeOf(attachedFile).startsWith("image")) {
      thumb.css("background-image", "url(" + attachedFile + ")");
    } else if (mimeTypeOf(attachedFile).startsWith("video")) {
      thumb.css("background-image", "url('../img/videoThumb.png')");
    } else if (mimeTypeOf(attachedFile).startsWith("audio")) {
      thumb.css("background-image", "url('../img/audioThumb.png')");
    } else {
      alert("Filetype not supported.");
      attachedFile = null;
      dataURL = null;
    }
    thumb.fadeIn("slow", function() {
      $("#close").show();
    });
    dataURL = null;
  };
  reader.onloadstart = function() {
    m.prop("disabled", true);
    m.val("Loading...");
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

// Setup the listeners
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

// Mouseover image event
function bigImg(event) {
  var target = event.target;
  $(target).animate(
    {
      maxHeight: 300,
      maxWidth: 500
    },
    scrollDown
  );
}

// Mouseleave image event
function normImg(event) {
  var target = event.target;
  $(target).animate({
    maxWidth: 100,
    maxHeight: 70
  });
}

// Delete attachment
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
