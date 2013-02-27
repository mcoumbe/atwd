/*
 * Main application file for the atwd library client 
 */

/*
 * Page initiation function thats run when the page has finished loading.
 * This anoymous function is responsible for:
 * - binding all Javascript based events to various DOM elements.
 * - loading any saved page state based on the location hash
 */
$(document).ready(function() {    
    
    ATWD.bind.page_load();
    
    // On page load check url for page data
    if(window.location.hash) {
        var hash = window.location.hash.substr(1); // Removes the hash
        var $_GET = {};
        var temp = hash.split("="); // Splits the key and value
        $_GET[decodeURIComponent(temp[0])] = decodeURIComponent(temp[1]);
        
        if($_GET['cc']) { // Creates linkable pages for books and course search
            ATWD.ajax.get_course_books($_GET['cc'], $('#results'));
        } else if ($_GET['book']) {
            ATWD.ajax.get_book_details($_GET['book'], undefined, $('#results'));
        }       
    }   
    
});


/*
 * ATWD - Advanced Topics in Web Development
 * Application Name space in order to prevent any naming conflicts.
 */
var ATWD = {    
    
    /*
     * Configuration Object
     */
    config: {
        debug: 0,
        url: "http://localhost/atwd/books/"
    },
    
    /*
     * Ajax library
     */
    ajax: {
        /*
         * Requests book information from the atwd web service
         */
        get_book_info:function(bookId) {
            ATWD.log("START - get_book_info request:");
            var results; // Results of the request to be returned for later use.
            $.ajax({
                async: false, // Request needs to be synchronous as data is needed for another request
                dataType: 'json',
                url: ATWD.config.url + "detail/" + bookId + "/json",
                success: function(data) {
                    try {
                        results =  ATWD.domain.single(data);
                    } catch (ex) { // Book doesn't exist
                        results = false;
                    }
                },
                complete: function() {
                    ATWD.log("END - get_book_info request");
                }
            });              
            return results;
        },
        get_book_details:function(bookId, preview, resultsContainer) {
            ATWD.log("START - get_book_details request:");
            
            /* I intended to implement caching with local storage here,
             * however with the display of the data containing the number of 
             * times a book has been borrowed it would have broken that
             * functionality.
             */
            if(false) {
                return false;
            }           
            
            var simplebook; // Object to hold default data on book
            
            /* When Preview exists the data can be retrieved from the dom,
             * rather than needing to send of a second request.
             */
            if(preview) {
                ATWD.log("Retriving data for preview.")
                simplebook = {
                    isbn: preview.attr('data-isbn'),
                    id: preview.attr('data-id'),
                    title: preview.attr('data-title'),
                    borrow_count: preview.attr('data-borrow-count')
                }
            } else {
                ATWD.log("Need to request data from webservice");
                simplebook = ATWD.ajax.get_book_info(bookId);
                if(!simplebook) {
                    resultsContainer.html("<h6>No book matching that id exists</h6>");
                    return false;
                }
            }
            
            // Sends a request to the google books api requesting extra information
            $.ajax({
                dataType: 'json',
                url: 'https://www.googleapis.com/books/v1/volumes?q=isbn:' + simplebook.isbn,
                beforeSend: function() {
                    /* When preview exists it means the basic page is showing,
                     * So I've added a loading "mask" to the element to show
                     * the user that the request is processing */                    
                    if(preview) {
                        preview.mask("loading...");
                    }
                    // Update the hash so that the last requested book has a linkable url
                    window.location.hash = "book=" + simplebook.id;
                },
                success: function(data) {
                    // Convert data into object
                    var book = ATWD.domain.complex(data, simplebook)
                    // Use object to generate html
                    var resultshtml = ATWD.html.generate_book_details(book)
                    // Replace containers html
                    if(preview) {
                        // Need to use replaceWith as we are replacing the preview container
                        resultsContainer.replaceWith(resultshtml);
                    } else {
                        resultsContainer.html(resultshtml);
                    }
                    
                },
                complete: function(data) {
                    /* Once the function has completed running, various events need
                     * to be bound to the newly created dom elements
                     */
                    ATWD.bind.book_search(simplebook.id, resultsContainer);
                    // Removes the loading "mask" if its been added
                    if(preview) {
                        preview.unmask();
                    }
                }
            });            
            
            ATWD.log("END - get_book_details request");
            return false;
        },
        /* Requests all books for courses and outputs the information to the dom
         */
        get_course_books:function(courseId, resultsContainer) {
            ATWD.log("START - get_course_books request");
            
            // Performs the request for course
            $.ajax({
                dataType: 'json',
                url: ATWD.config.url + "course/" + courseId + "/json",
                beforeSend: function() {
                    // Update the hash to create a linkable url
                    window.location.hash = "cc=" + courseId;
                },
                success: function(data) {
                    
                    var results_list = "";
                    /* When books is undefined it either means something went wrong
                     * or simply there are no books available for that course
                     */
                    if(data.books==undefined) {
                        ATWD.error("Books is undefined, something has gone wrong.");
                        resultsContainer.html("<h6>No Books are available for this Course</h6>")
                        return; // need to quit the processing at this point.
                    }
                    /* For a single book i simply add it to an array, so I can use
                     * the same processing code for both cases.
                     */
                    if(!$.isArray(data.books.book)) {
                        var temp = data.books.book;
                        data.books.book = [];
                        data.books.book.push(temp);
                    }
                    ATWD.log("Building Results List");
                    
                    /* Loop through each book that is returned and generate
                     * html.
                     */
                    for(book in data.books.book) {
                        var tempbook = Book.simple(data, book);
                        results_list += ATWD.html.generate_book_listing(tempbook);
                    }
                    resultsContainer.html(results_list);
                },
                complete: function() {
                    /* Once the function has completed running, various events need
                     * to be bound to the newly created dom elements
                     */
                    ATWD.bind.course_search();
                    ATWD.log("END - get_course_books request");
                }
            });  
            return false;
        },
        /* Requests all suggestions for a book and adds the data to a jquery.datatable
         * in a modal window.
         */
        get_suggestions_for_book:function(bookId) {
            ATWD.log("START - get_suggestions_for_book request");
            
            $.ajax({
                url: ATWD.config.url + "suggestions/" + bookId + "/json",
                success: function (data) {
                    var booklist = []
                    
                    // When data.books is undefined it means there are no suggestions available
                    if(data.books==undefined) {
                        $('#suggestions').html("<tr><td class='page-center'>No Suggestions Avaliable For This Book</td></tr>");
                        $('#modal').modal({
                            onClose: function() {
                                $('#modal').html("<table id='suggestions'></table>");
                                $.modal.close();
                            }
                        });
                        return;
                    };
                    
                    /* For a single book i simply add it to an array, so I can use
                     * the same processing code for both cases.
                     */
                    if(!$.isArray(data.books.suggestions.isbn)) {
                        var temp = data.books.suggestions.isbn;
                        data.books.suggestions.isbn = [];
                        data.books.suggestions.isbn.push(temp);
                    };

                    /* Using the jquery simplemodal plugin, create a modal window
                     * with and callback onclose method that clears the table of data.
                     */
                    $('#modal').modal({
                        onClose: function() {
                            $('#modal').html("<table id='suggestions'></table>")
                            $.modal.close();
                        }
                    });
                                         
                    for(book in data.books.suggestions.isbn) {
                        var temp = data.books.suggestions.isbn[book]['@attributes'];
                        booklist.push([temp.isbn, temp.id, ((temp.common/temp.total) * 100).toFixed(2), ((temp.before/temp.total)*100).toFixed(2), ((temp.after/temp.total)*100).toFixed(2)]);
                    };
                    
                    /* Using the jquery datatables plugin, creates a sortable
                     * data table with all the suggestions data for the selected
                     * book
                     */
                    var dataTable = $('#suggestions').dataTable({
                        "aaData": booklist,
                        "aoColumns": [
                        {
                            "sTitle": "ISBN"
                        },
                        {
                            "sTitle": "Id"
                        },
                        {
                            "sTitle": "Common Loans %", 
                            "sClass": "center"
                        },
                        {
                            "sTitle": "Read Before %", 
                            "sClass": "center"
                        },
                        {
                            "sTitle": "Read After %", 
                            "sClass": "center"
                        },
                        ]
                    });
                    
                    // Adds informative text after the table.
                    $('#suggestions').after("<h5>Clicking Any row will take you to the books information page</h5><h6>It should be noted that information is missing for some book ids</h6>");
                    
                    /* Adds onclick functionality to each of the table rows,
                     * the method ensures that when tables are clicked the window
                     * is closed and the data (if it exists) is loaded for the 
                     * book the table refers to
                     */
                    $('#suggestions tbody tr').click(function() {
                        var bookId = $(this).find('td')[1].innerHTML;
                        $('#modal').html("<table id='suggestions'></table>")
                        $.modal.close();
                        ATWD.ajax.get_book_details(bookId, undefined, $('#results'));
                    });
                }
            });            
            
            ATWD.log("END - get_suggestions_for_book request");
        },
        /* Does a post request that updates the borrow count of a book
         */
        borrow_book:function(bookId) {
            ATWD.log("START - borrow_book request");
            $.ajax({
                url: ATWD.config.url + "/borrow",
                type: 'POST',
                data: "itemId=" + bookId,
                success: function(data) {
                    console.log(data);
                    $('.borrowcount.' + bookId).html("Borrow Count: " + data.book['@attributes'].borrowedcount);
                },
                complete: function() {
                    ATWD.log("END - borrow_book request");
                }
            });
        }
    },
    
    /*
         * Event binding library
         * - Adds functionality to dynamically generated dom elements
         */
    bind: {
        /* Initial page load bindings that configure the two forms
         */
        page_load: function() {
            $('#book_details_form').submit(function() {
                return ATWD.ajax.get_book_details($('#book_id').val(), undefined, $('#results'));
            });
            $('#course_books_form').submit(function() {
                return ATWD.ajax.get_course_books($('#coursecode_select :selected').val(), $('#results'));
            });
        },
        /* To be called when ever a course search is performed
         */
        course_search: function() {
            var container = $('.short-result');
            ATWD.log("Rebinding hover functionality.")
            
            // Calling unbind on the elements as I've experienced a couple bugs
            // where functionality wasn't working correctly
            container.unbind('hover');
            
            // Adds a background color change and a highlight on the book title
            container.hover(function() {
                $(this).css('background-color', '#f5f5f5');
                $(this).find('.highlight').css('text-decoration', 'underline');
            }, function() {
                $(this).css('background-color', 'transparent');
                $(this).find('.highlight').css('text-decoration', 'none');
            });
            
            
            ATWD.log("Rebinding Click functionality.")
            
            // Calling unbind on the elements as I've experienced a couple bugs
            // where functionality wasn't working correctly
            container.unbind('click');
            
            // Adds click listener to the entire div container for the book preview.
            container.click(function() {
                var container = $(this);
                ATWD.ajax.get_book_details(undefined, container, container);
            });            
        },
        /* To be called when book searches are performed
         */
        book_search: function(bookId) {
            /* Adds submit behaviour to the borrow book and view suggestions forms
             */
            $('.borrow-book.' + bookId).submit(function() {  
                ATWD.ajax.borrow_book(bookId);
                return false
            });
            $('.book-suggestions.' + bookId).submit(function() {
                ATWD.log("Book suggestions clicked!");
                ATWD.ajax.get_suggestions_for_book(bookId);
                return false;
            });
        }        
    },
    
    /*
         * Dom creation library
         * - creation of dom elements
         */
    html: {
        generate_book_listing:function(book) {
            return '<div class="row">\n\
                        <div class="span8">\n\
                            <div class="short-result" data-isbn="' + book.isbn + '" data-container="short-result" data-id="' + book.id + '" data-title="' + book.title + '" data-borrow-count="' + book.borrow_count + '" >\n\
                                <div class="image">\n\
                                    <img src="http://covers.openlibrary.org/b/isbn/' + book.isbn + '-S.jpg">\n\
                                </div>\n\
                                <div class="title">\n\
                                    <h4 class="highlight">' + book.title + '</h4>\n\
                                    <br />\n\
                                    <h5>ISBN: ' + book.isbn + '</h5>\n\
                                </div>\n\
                                <div class="expandme">\n\
                                    <h6>Item Id: ' + book.id + '</h6>\n\
                                    <h6 class="borrowcount">Borrow Count: ' + book.borrow_count + '</h6>\n\
                                    \n\
                                </div>\n\
                                <div class="clear-fix">\n\
                                </div>\n\
                            </div>\n\
                        </div>\n\
                    </div>'
        },
        generate_book_details:function(book) {
            var b = book;
            return '<div class="book-result" data-id="' + b.id() +'">\n\
                        <div class="large-cover">\n\
                            <img src="' + b.image() + '"/>\n\
                        </div>\n\
                        <div class="title">\n\
                            <h4>' + b.title() + '</h4>'
            + b.sub_title() + 
            '<h6>' + b.authors() + '</h6>\n\
                        </div>\n\
                        <div class="expandme">\n\
                            <h6>Item Id: ' + b.id() + '</h6>\n\
                            <h6 class="borrowcount ' + b.id() + '">Borrow Count: ' + b.borrow_count() + '</h6>\n\
                            <form class="borrow-book ' + b.id() + ' form-inline"><button class="btn btn-block" type="submit">Borrow Book</button></form>\n\
                            <form class="book-suggestions ' + b.id() + ' form-inline"><input type="hidden" name="itemId" value="' + b.id() +'"/><button class="btn btn-block" type="submit">View Suggestions</button></form>\n\
                        </div>\n\
                        <div class="description">\n\
                            <hr />'
            + b.description() +
            '</div>'                    
            + '<table class="table table-striped">'
            + '<thead>'
            + '<tr>'
            + '<th>Extra Info</th>'
            + '<th></th>'
            + '<th></th>'
            + '</tr>'
            + '</thead>'
            + '<tbody>'
            + '<tr>'
            + '<td>Page Count: </td>'
            + '<td></td>'
            + '<td>'
            + b.page_count()
            + '</td>'
            + '</tr>'
            + '<tr>'
            + '<td>Publisher: </td>'
            + '<td></td>'
            + '<td>'
            + b.publisher()
            + '</td>'
            + '</tr>'
            + '<tr>'
            + '<td>Published Date: </td>'
            + '<td></td>'
            + '<td>'
            + b.publish_date()
            + '</td>'
            + '</tr>'
            + '</tbody>'
            + '</table>'
            + '</div>';
        }
    },
    
    /*
         * Models
         * - creation of objects
         */
    domain: {
        error_msg: "Information Unavailable",
        single:function(data) {
            return {
                title: data.book['@attributes'].title,
                isbn: data.book['@attributes'].isbn,
                id: data.book['@attributes'].id,
                borrow_count: data.book['@attributes'].borrowedcount
            }
        },
        simple:function(data, book) {
            return {
                title: data.books.book[book]['@attributes'].title,
                isbn: data.books.book[book]['@attributes'].isbn,
                id: data.books.book[book]['@attributes'].id,
                borrow_count: data.books.book[book]['@attributes'].borrowedcount
            }
        },
        complex:function(data, sb) {
           
           // When no books are returned by google, all the code breaks.
           // So this is a lazy fix to ensure that undefined errors arent
           // caused by the return statement
            if(data.items) {            
                var b = data.items[0];
            } else {
                var b = {
                    volumeInfo: {}
                }
            };
        
            return {
                authors: function() {                
                    if(!b.volumeInfo.authors) {
                        return "Authors information is Unavailable.";
                    };         
                
                    var authors = "By ";
                
                    for(author in b.volumeInfo.authors) {
                        authors += b.volumeInfo.authors[author] + ", ";
                    };
                
                    return authors.substr(0, authors.length - 2);
                },
                borrow_count: function() {
                    return sb.borrow_count;
                },
                description: function() {
                    return (b.volumeInfo.description) ? b.volumeInfo.description : ATWD.domain.error_msg;
                },
                image: function() {
                    return (b.volumeInfo.imageLinks && b.volumeInfo.imageLinks.thumbnail) ? b.volumeInfo.imageLinks.thumbnail : "http://covers.openlibrary.org/b/isbn/" + sb.isbn + "-S.jpg";
                },
                id: function() {
                    return sb.id;
                },
                isbn: function() {
                    return sb.isbn;
                },
                publisher: function() {
                    return (b.volumeInfo.publisher) ? b.volumeInfo.publisher : ATWD.domain.error_msg;
                },
                publish_date: function() {
                    return (b.volumeInfo.publishedDate) ? b.volumeInfo.publishedDate : ATWD.domain.error_msg;
                },
                sub_title: function() {
                    return (b.volumeInfo.sub_title) ? "<h5>"+b.volumeInfo.sub_title+"</h5>" : "";
                },
                title: function() {
                    return (b.volumeInfo.title) ? b.volumeInfo.title : sb.title;
                },  
                page_count: function() {
                    return (b.volumeInfo.pageCount) ? b.volumeInfo.pageCount : ATWD.domain.error_msg;
                }
            }
        }
    },
    
    log:function(message) {
        if(ATWD.config.debug) {
            console.log(message);
        }
    },
    
    error:function(message) {
        if(ATWD.config.debug) {
            console.log("Error - " + message);
        }
    }

    
}


