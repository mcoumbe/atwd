<?php

/**
 * Response object for suggestions requests
 */
class Suggestions extends WSResponse {
    
    public function __construct($itemId) {
        parent::__construct(parent::SUGGESTIONSFILE);
        $this->id = $itemId;
        
        // Creates the xpath objects and queries for the books suggestions.
	$xpath = new DOMXpath($this->dataSet);        	
	$suggestions = $xpath->query("/booksuggestions/suggestions[@for-id='$itemId']/item");

        // If no suggestions length is 0 then it is likely that the item id is wrong
        if($suggestions->length==0) {
            return $this->error(parent::INVALID_ITEM_ID, parent::INVALID_ITEM_CODE);
        }
        
        // Builds a basic node structure for the results object
        $node = $this->results->createElement("results");
	$resultsNode = $this->results->appendChild($node);
        
	$node = $this->results->createElement("suggestionsfor", $itemId);
        $resultsNode->appendChild($node);
        
        $node = $this->results->createElement("books");
        $booksNode = $resultsNode->appendChild($node);
        
        $node = $this->results->createElement("suggestions");
        $suggestionsNode = $booksNode->appendChild($node);
        
        $nodesArray = Array();
                
        // Processes each of the found suggestions into the required format.
        foreach ($suggestions as $s) {
            
            $common = $s->getAttribute("common");
            $before = $s->getAttribute("before");
            $same = $s->getAttribute("same");
            $after = $s->getAttribute("after");
            $total = $s->getAttribute("total");
            $isbn = $s->getAttribute("isbn");
            $id = $s->nodeValue;
            
            $node = $this->results->createElement("isbn", $isbn);
            $node->setAttribute("id", $id);
            $node->setAttribute("common", $common);
            $node->setAttribute("before", $before);
            $node->setAttribute("same", $same);
            $node->setAttribute("after", $after);
            $node->setAttribute("total", $total);
            
            // Adds each node to an array so they can be sorted before being returned
            array_push($nodesArray, $node);               
            
        }
        
        // Custom sorting function that organizes based on total number of suggestions
        usort($nodesArray, function($nodeOne, $nodeTwo) {
            return $nodeOne->getAttribute("total") >= $nodeTwo->getAttribute("total");
        });
        
        // Finally appends the nodes in order to the results object
        foreach($nodesArray as $node) {
            $suggestionsNode->appendChild($node);
        }
        
    }
    
    /**
     * Overridden method, there is a feature with simplexml_load_string that
     * doesn't load the attributes properly for nodes that have a nodeValue.
     * @return type
     */
    public function toJSON() {
        // This performs the same function as the Suggestions constructor        
        header(self::TYPE_JSON);
        	
        $xpath = new DOMXpath($this->dataSet);        
	$suggestions = $xpath->query("/booksuggestions/suggestions[@for-id='$this->id']/item");
        
        // Dirty hack to produce a standard error message.
        if($suggestions->length==0) {            
            return json_encode(simplexml_load_string($this->results->saveXML()));
        }
                
        $oldNode = $this->results->getElementsByTagName('suggestions')->item(0);
        
        $suggestionsNode = $this->results->createElement("suggestions");
        
        $this->results->getElementsByTagName("books")->item(0)->replaceChild($suggestionsNode, $oldNode);
        
        $nodesArray = Array();
                
        foreach ($suggestions as $s) {
            
            $common = $s->getAttribute("common");
            $before = $s->getAttribute("before");
            $same = $s->getAttribute("same");
            $after = $s->getAttribute("after");
            $total = $s->getAttribute("total");
            $isbn = $s->getAttribute("isbn");
            $id = $s->nodeValue;
            
            $node = $this->results->createElement("isbn");
            $node->setAttribute("isbn", $isbn);
            $node->setAttribute("id", $id);
            $node->setAttribute("common", $common);
            $node->setAttribute("before", $before);
            $node->setAttribute("same", $same);
            $node->setAttribute("after", $after);
            $node->setAttribute("total", $total);

            array_push($nodesArray, $node);               
            
        }
        
        usort($nodesArray, function($nodeOne, $nodeTwo) {
            return $nodeOne->getAttribute("total") >= $nodeTwo->getAttribute("total");
        });
        
        foreach($nodesArray as $node) {
            $suggestionsNode->appendChild($node);
        }       
        
        $xml = simplexml_load_string($this->results->saveXML());
        return json_encode($xml);
    }
    
    
}

?>
