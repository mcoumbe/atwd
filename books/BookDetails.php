<?php

include_once 'WSResponse.php';


/**
 * Response object for book searches based on itemId
 */
class BookDetails extends WSResponse
{
    
    function __construct($itemId) {
        parent::__construct(parent::BOOKSFILE);
        
        // Create xpath object and query for book on itemid
        $xpath = new DOMXpath($this->dataSet);        	
	$book = $xpath->query("/bookcollection/items/item[@id=$itemId]");
               
        // When length = 0 no matching book id was found.
        if($book->length==0) {
            return $this->error(parent::INVALID_ITEM_ID, parent::INVALID_ITEM_CODE);
        }
        
        // Create required node structure
        $node = $this->results->createElement("results");
	$resultsNode = $this->results->appendChild($node);
        
        $node = $this->results->createElement("book");
        $bookNode = $resultsNode->appendChild($node);
        
        $item = $book->item(0);
        $child = $item->firstChild;
        
        //Get all the attributes
        $id = $item->getAttribute("id");
        $title = $child->nextSibling;
        $isbn = $title->nextSibling->nextSibling;
        $borrowedCount = $isbn->nextSibling->nextSibling->nextSibling->nextSibling;

        // Set all attributes
        $bookNode->setAttribute("id", $id);
        $bookNode->setAttribute("title", $title->nodeValue);
        $bookNode->setAttribute("isbn", $isbn->nodeValue);
        $bookNode->setAttribute("borrowedcount", $borrowedCount->nodeValue);
        
    }
    
    
}


?>
