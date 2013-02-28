<?php
/**
 * response object for borrow book requests
 *
 * @author Mike
 */
class BorrowBook extends WSResponse {
    
    function __construct($itemId) {
        parent::__construct(parent::BOOKSFILE);
        
        // Creates the xpath objects and queries for the books item entry.
        $xpath = new DOMXpath($this->dataSet);                
        $books = $xpath->query("/bookcollection/items/item[@id=$itemId]");
                
        if($books->length==0) { // Book was not found
             return $this->error(parent::INVALID_ITEM_ID, parent::INVALID_ITEM_CODE);
        }
               
        // Creates required dom structure
        $node = $this->results->createElement("results");
	$resultsNode = $this->results->appendChild($node);
        
        $node = $this->results->createElement("book");
        $bookNode = $resultsNode->appendChild($node);
        
        $book = $books->item(0);
        $child = $book->firstChild;
        
        //Get all the attributes
        $id = $book->getAttribute("id");
        $title = $child->nextSibling;
        $isbn = $title->nextSibling->nextSibling;
        $borrowedCount = $isbn->nextSibling->nextSibling->nextSibling->nextSibling;
        
        // Sets attributes of book node
        $node->setAttribute("id", $id);
        $node->setAttribute("title", $title->nodeValue);
        $node->setAttribute("isbn", $isbn->nodeValue);
        $node->setAttribute("borrowedcount", $borrowedCount->nodeValue+1);        
        
        // Updates the actual node and saves the value
        $books->item(0)->getElementsByTagName('borrowedcount')->item(0)->nodeValue = $borrowedCount->nodeValue+1; 
        $this->dataSet->save(parent::BOOKSFILE);        
    }
    
    
}

?>
