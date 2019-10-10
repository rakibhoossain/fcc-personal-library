/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

// We'll need MongoDB's ObjectId in order to be able to validate the unique IDs of our books:
const ObjectId = require('mongodb').ObjectId;




// To make sure that our route handling middleware will be available outside of this module, we'll export it:
module.exports = function (app, database) {
  
  
  app.route('/api/books')
  
    /*
    USER STORY 4: I can get /api/books to retrieve an array of all books containing title, _id, & commentcount.
    */
    .get(function (req, res){
    
    // Let's go ahead and query the "books" collection of our "test" database. Note that .find() doesn't take a callback, so we chain .toArray() and callback there:
    database.db("test").collection("books").find().toArray( (err, books) => {
      // We'll handle any errors...
      if (err) return console.log("Error getting all book titles:", err);
      // ... and if there are no errors, we'll tally the number of comments for each and save the value:
      
      books.forEach( (book) => {
        (book.comments) ? book.commentcount = book.comments.length : book.commentcount = 0;
      });
      
      // With the comment count done, let's return the array of all the books as requested:
      return res.json(books);
      
    })  // END of .toArray() callback function
  })  // END of GET
    
  
  
  
  
    /*
    USER STORY 3: I can post a title to /api/books to add a book and returned will be the object with the title and a unique _id.
    */
    .post(function (req, res){
      let title = req.body.title;
    
      // We'll do a bit of server-side validation to make sure that the submitted POST form actually has a book title included in it:
      if (title == undefined) return res.json("no title submitted");
      
      // If we have received a title, let's now add the book to the database using findOneAndUpdate(). If there's already a matching book title, then we'll return its
      // info and not add another book with the same name. With upsert=true, we'll create a new document entry if there are no existing books by that name already in our
      // database. With setOnInsert we'll add an empty comments array if the book is indeed a new addition to the library:
      database.db("test").collection("books").findOneAndUpdate(
        {title: title},
        {
          $set: {title: title},
          $setOnInsert: {comments: []}
        },
        {
          upsert: true,
          returnNewDocument: true
        },
        (err, book) => {
          // We'll handle any errors that might arise from the remote/async activity...
          if (err) return console.log("Error adding book:", err);
          // ... and if there are no errors, we'll return the book's details, noting if the book is a new addition to the library or if it was already present:
          
          if (book.lastErrorObject.updatedExisting) {
            return res.json({
              title: book.value.title,
              _id: book.value._id,
              comments: book.value.comments,
              inDBbefore: "yes"
            });
          }
          else {
            return res.json({
              title: title,
              _id: book.lastErrorObject.upserted,
              comments: [],
              inDBbefore: "no"
            });
          }
        }); // END of .findOneAndUpdate()
    })  // END of POST new book to library
    
  
  
  
    
    /*
    USER STORY 9: I can send a delete request to /api/books to delete all books in the database. Returned will be 'complete delete successful' if successful.
    */
    .delete(function(req, res){
      // Let's go ahead and delete the entire collection of "books" using the .deleteMany() method (N.B. the .remove() method is deprecated):
      database.db("test").collection("books").deleteMany( {}, (err, result) => {
        // We'll handle any errors first...
        if (err) return console.log("Error deleting entire library:", err);
        // ... and if there are no errors, we'll return an appropriate message:
        return res.json("complete delete successful");
      
      });
    });



  
  
 
  app.route('/api/books/:id')
  
     /*
    USER STORY 5: I can get /api/books/{_id} to retrieve a single object of a book containing title, _id, & an array of comments (empty array if no comments present).
    USER STORY 8: If I try to request a book that doesn't exist I will get a 'no book exists' message.
    */
    .get(function (req, res){
      let bookId = req.params.id;
      
      // Let's start with a bit of validation on the requested bookId. If the submitted ID is a valid ObjectID, we'll convert it from a string to an ObjectID:
      let _id;
      if ( ObjectId.isValid(bookId) ) {
        _id = ObjectId(bookId);
      }
      else {
        return res.json("no book exists");    // Would be better if the message said that the _id is not a valid type
      };
    
      database.db("test").collection("books").findOne( {_id: _id}, (err, book) => {
        // We'll handle any errors...
        if (err) return console.log("Error finding one book:", err);
        
        // ... and also the potential situation where the requested bookId is a valid ObjectId, but not one that exists in our library:
        if (book) {
          return res.json({
            title: book.title,
            _id: book._id,
            comments: book.comments
          });
        }
        else {
          return res.json("no book exists");
        };
        
      })  // END of .findOne()
    }) //END of GET details about one book
    
    
    
    
    
    /*
    USER STORY 6: I can post a comment to /api/books/{_id} to add a comment to a book and returned will be the books object similar to get /api/books/{_id}.
    */
    .post(function(req, res){
      let bookId = req.params.id;
      let comment = req.body.comment;
    
      // Let's start with a bit of validation on the requested bookId. If the submitted ID is a valid ObjectID, we'll convert it from a string to an ObjectID:
      let _id;
    
      if ( ObjectId.isValid(bookId) ) {
        _id = ObjectId(bookId);
      }
      else {
        return res.json("no book exists");
      };
      
      
      // With the validation done, let's .updateOne() our book:
      database.db("test").collection("books").updateOne(
        {_id: _id},
        {
          $push: {"comments": comment} // We'll use the positional operator ($) along with the $push update operator to .push() the new comment onto the book's comments array
        },
        (err, book) => {
          // We'll handle any errors that might arise from the remote/async activity...
          if (err) return console.log("Error adding comment:", err);
          // ... and if we DID NOT have a match for our query, we'll need to return an appropriate message:
          if (book.modifiedCount != 1) {
            return res.json("no book exists");
          }
          // If there was a modified book, then we'll need to return the book's information and full comment list. However, because .updateOne() doesn't actually return
          // the matched document, we'll have to do another search of the database to get the book's details and return them. We'll do this here in the else statement in
          // order to avoid having this query return a result before our .updateOne() method has updated the document in our database:
          else {
            database.db("test").collection("books").findOne( {_id: _id}, (err, book) => {
              // We'll again handle any errors first...
              if (err) return console.log("Error retrieving book details within .updateOne():", err)
              // ... and if there are no errors, we'll return the details of the updated book as requested:
              return res.json({
                title: book.title,
                _id: book._id,
                comments: book.comments
              });
            });  // END of .findOne();
          };  // END of if/else statements
          
      });  // END of .updateOne()
  
  }) // END of POST new comment
  
  
  
  
  
    /*
    USER STORY 7: I can delete /api/books/{_id} to delete a book from the collection. Returned will be 'delete successful' if successful.
    */
    .delete(function(req, res){
      let bookId = req.params.id;
    
      // Let's go right ahead and do some data validation once more:
      let _id;
      if ( ObjectId.isValid(bookId) ) {
        _id = ObjectId(bookId);
      }
      else {
        return res.json("no book exists");
      };
    
      // With the validation complete, let's go ahead and delete the book from the library:
      database.db("test").collection("books").deleteOne( {_id: _id}, (err, book) => {
        // We'll handle any errors...
        if (err) return console.log("Error deleting book:", err);
        // ... and if there are no errors, we'll make sure that a book was deleted, and then return an appropriate message:        
        if (book.deletedCount == 1) {
          return res.json("delete successful");
        }
        else {
          return res.json("something utterly unexpected happened. weird!");
        }
      
      });  // END of .deleteOne()
    });  //END of DELETE one book
  
  
  
};  // END of module.exports()