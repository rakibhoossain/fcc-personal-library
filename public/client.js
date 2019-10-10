$(document).ready(function() {
  
  // When the page is fully loaded, we'll run the following scripts:
  
  
  // The first thing we want to happen when the page loads is for the list of books in our library to be shown. To this end, we'll set up two empty arrays,
  // one of which we'll fill with an HTML <li> for each book we want to show, and the other which will be a copy of our data so that we can match bookId by index:
  let listItems = [];
  let itemsRaw = [];
  
  // We'll then GET all the books from our library...
  $.getJSON("/api/books", function(data) {
    itemsRaw = data;
    
    // We'll iterate through all the books in our library, and build an unorderered list of up to 15 books:
    $.each(data, function(i, ele) {
      listItems.push('<li class="bookItem" id="' + i + '">' + ele.title + ' (' + ele.commentcount + ' comments)</li>');
      // and we'll stop iretating through the books if we get to 15 books:
      return ( i !== 14 );
    });
    // We'll then add a little note saying how many more books there are in the library:
    if (listItems.length >= 15) {
      listItems.push('<p>...and '+ (data.length - 15) + ' more books!</p>');
    }
    
    // Finally, we'll add all of our <li> items inside an unordered list element, and append it to the already existing #display DIV on our page:
    
    if (listItems.length > 0) {
      $("<ul/>", {
        "class": "listWrapper",
        html: listItems.join("")
      }).appendTo("#bookList");
    }
    else {
      $("#bookList").html("<p>(Please add your first book to the library.)</p>");
    }
  });
  
  
  // With the list of books ready, we'll work on presenting the comments for each book in the list:
  // We'll keep the current comments in an array, which we'll define here:
  let comments = [];
  // Whenever a list class=bookItem is clicked in our list of books, we want the following to happen:
  $("#bookList").on("click", "li.bookItem", function() {
    
    // We'll first save the current book's data to a variable to keep things tidy...
    let bookData = itemsRaw[this.id];
    
    // ... then we'll replace the placeholder "Select a book to see its details and comments" text with a better title:
    $("#commentListTitle").html("<h3>Comments for \"" + bookData.title + "\"</h3>");
    // ... and add the book ID for the clicked book...
    $("#currentBookId").html("<p id=\"bookId\">_id: " + bookData._id + "</p>");
    
    
    // With our "headers" done, we'll create an array in which we'll be saving <li> items for each of the book's comments, and we'll prepopulate it with an opening <ol>:
    comments = ['<ol>'];
    // Let's then iterate through all the comments for the book, creating the individual <li> items, and adding them to our comments array:
    $.each(bookData.comments, function(i, ele) {      
      comments.push("<li>" + ele + "</li>");
    });    
    // Then, once we have all of our comments listed in our array, we'll close the <ol>...
    comments.push('</ol>');
    // ... and add the newCommentForm as well as the deleteBook button:
        //N.B. the original boilerplate assigned the SAME id to both the commentform and the deletebook button, which is a big no-no. To correct this, we've added "comment" and "delete" to the ids and will strip this off later:
    comments.push('<form id="newCommentForm"><label for="addComment' + bookData._id + '">Add a new comment</label><input type="text" id="addComment' + bookData._id + '" class="commentToAdd" name="commenttext" required><input type="submit" value="Add Comment"></form>');
    comments.push('<button class="deleteBook" id="delete'+ bookData._id + '">Delete This Book</button>');

    // Finally, we'll populate our already existing #commentDetails DIV with everything that's in our comments DIV:
    // To make things a bit smoother to the eye, we'll first hide the contents of the #commentList DIV, the add our comments array contents to the #commentDetails DIV,
    // re-show our title and ID DIVs, and then take advantage of jQuery's .slideDown() method to have the comments reappear in a slightly nicer way:
    $("#commentListTitle, #currentBookId, #commentList").hide();
    setTimeout( () => {
      $("#commentDetails").html(comments.join(""));
      $("#commentListTitle, #currentBookId").show();
      $("#commentList").slideDown(300);
    }, 100);    
    
  });
  
  
  
  
  
  
  // When the user submits the "new book form", we want the following to happen:
  $("#newBookForm").submit( function(e) {
    // We'll prevent the actual execution of the form submission...
    e.preventDefault();
    
    // ... and then carry out our ajax request:    
    $.ajax({
      url: "/api/books",
      type: "POST",
      data: $(this).serialize(),
      success: function(data) {
        // We'll simply reload the page so that the list of books can update:
        window.location.reload(true);
      },
      error: function(req, message, err) {
        if (err) return console.log("Error with ajax POST method for a new book:", err);
      }
    });
  });
  
  
  
  
  
  // When the user submits a new comment to the current book, we want the following to happen:
  // Because the newCommentForm was dynamically added to the document, $("#newCommentForm").submit() won't find anything. Instead we have to listen to the whole document:
  $(document).on("submit", "#newCommentForm", function(e) {
    // We'll prevent the actual execution of the form submission...
    e.preventDefault();
    // ... then we'll save the value that's in the input field of the form.
    let newComment = $(".commentToAdd").val();
    // We'll also remove the "addComment" string from the form's input field's id attribute in order to isolate the bookId:
    let bookId = $(".commentToAdd")[0].id.substring(10);
    
    // ... and perform our ajax request to add the comment to the current book:
    $.ajax({
      url: "/api/books/" + bookId,
      type: "POST",
      data: {_id: bookId, comment: newComment },
      success: function(data) {
        // Upon success, we'll add the comment to our comments array, which should still have all of its content from when bookItem was clicked:
        // We'll insert the new comment at the end of our comments list (ie. at index commentsArrLength - 3 so that it is placed right before the closing <ol> tag), making sure
        // to not delete any other elements in our comments array:
        let index = comments.length - 3;
        comments.splice(index, 0, "<li>" + newComment + "</li>");
        // With the new comment added to the list, we'll update the list of comments on the page:
        $("#commentDetails").html(comments.join(""));        
      },
      error: function(req, message, err) {
        if (err) return console.log("Error adding comment to book:", err);
      }
    });
  });
  
  
  
  
  
  // When the user clicks on the deleteBook button, we want the following to happen:
  // Because the newCommentForm was dynamically added to the document, there won't be any listeners for events on $(".deleteBook"). We have to listen to the whole document:
  $(document).on("click", ".deleteBook", function() {
    
    // We'll remove "delete" from the ID in order to isolate the book's ID:
    let bookId = this.id.substring(6);
    
    // We'll make sure that deleting the book isn't an accident:
    let confirmation = confirm("Are you sure that you want to delete this book?\n\n(book id: " + bookId + ")\n\n");
    
    if (confirmation == true) {
      $.ajax({
        url: "/api/books/" + bookId,
        type: "DELETE",
        success: function(data) {
          // We'll provide a confirmation message...
          alert(data + "\n\n");
          // ... and reload the page so that the list of books gets updated:
          window.location.reload(true);
        }
      });
    };  // END of if statement   
    
  });  
    
  
  
  
  
  // When the user submits the "delete all books" form, we want the following to happen:
  $("#deleteAllBooksForm").submit(function(e) {
    // We'll prevent the actual execution of the form submission...
    e.preventDefault();
    
    
    // ... and make sure that the user ACTUALLY wants to delete ALL the books:
    let confirmation = confirm("Are you sure that you want to delete ALL the books\nthat are in the library?\n\n");
    // If they really do want to delete all the books, we'll carry out our AJAX request:
    if (confirmation == true) {
      $.ajax({
        url: "/api/books",
        type: "DELETE",
        success: function(data) {
          // We'll respond with an alert containing the message from the API...
          alert(data + "\n\n");
          // ... and reload the page to be able to update the list of books:
          window.location.reload(true);
        },
        error: function(req, message, err) {
          if (err) return console.log("Error with ajax DELETE method for all books:", err);
        }
      });      
    };  // END of if statement  
    
  });
  
  
});