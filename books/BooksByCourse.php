<?php

include_once 'WSResponse.php';

/**
 * Response object for course book searches
 */
class BooksByCourse extends WSResponse
{   
    
    public function __construct($courseId) {
        parent::__construct(parent::BOOKSFILE);
        
        // Creates xpath object and searches for the courseId
	$xpath = new DOMXpath($this->dataSet);        	
	$validBooks = $xpath->query("/bookcollection/items/item/courses/course[text()='$courseId']");
        
        // If empty it means an invalid course id has been used
        if($validBooks->length==0) {
            return $this->error(parent::INVALID_COURSE_ID, parent::INVALID_COURSE_CODE);
        }
        
        // Creates required node structure
	$node = $this->results->createElement("results");
	$resultsNode = $this->results->appendChild($node);
        
	$node = $this->results->createElement("course", $courseId);
        $resultsNode->appendChild($node);
        
        $node = $this->results->createElement("books");
        $booksNode = $resultsNode->appendChild($node);
                
        $nodesArray = Array();
        
        /* Processing loop that creates each book node 
         */                
        foreach ($validBooks as $book) {
            
            //Get the parent item
            $item = $book->parentNode->parentNode;
            $child = $item->firstChild;
            
            //Get all the attributes
            $id = $item->getAttribute("id");
            $title = $child->nextSibling;
            $isbn = $title->nextSibling->nextSibling;
            $borrowedCount = $isbn->nextSibling->nextSibling->nextSibling->nextSibling;
                                   
            // Set all attributes
            $node = $this->results->createElement("book");
            $node->setAttribute("id", $id);
            $node->setAttribute("title", $title->nodeValue);
            $node->setAttribute("isbn", $isbn->nodeValue);
            $node->setAttribute("borrowedcount", $borrowedCount->nodeValue);

            // Stores the nodes in an array for sorting.
            array_push($nodesArray, $node);
        }
        
        // Custom sorting function that orders based on borrowed count
        usort($nodesArray, function($nodeOne, $nodeTwo) {
            return $nodeOne->getAttribute("borrowedcount") <= $nodeTwo->getAttribute("borrowedcount");
        });
        
        // Appends the sorted nodes to the results object
        foreach($nodesArray as $node) {
            $booksNode->appendChild($node);
        }
        
    }    
    
}

?>