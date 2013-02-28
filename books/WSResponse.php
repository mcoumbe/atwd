<?php

/**
 * Generic Web Service Response Object
 */
class WSResponse
{
    
    // Data Files
    const BOOKSFILE = "data/books.xml";
    const COURSESFILE = "data/courses.xml";
    const SUGGESTIONSFILE = "data/suggestions.xml";
    
    // Codes and Messages
    const SERVICE_ERROR_ID = 500;
    const SERVICE_ERROR_CODE = "Internal Exception";   
    const INVALID_COURSE_ID = 501;
    const INVALID_COURSE_CODE = "Invalid Course Code";
    const INVALID_ITEM_ID = 502;
    const INVALID_ITEM_CODE = "Invalid Item ID";
    const INVALID_PATTERN_ID = 503;
    const INVALID_PATTERN_CODE = "URL Pattern not recognized";
    
    // Content Types
    const TYPE_JSON = "Content-type: application/json";
    const TYPE_XML = "Content-type: application/xml";

    protected $results = null; // result object 
    protected $dataSet; // dataset to be used
    protected $id;
       
    
    function __construct($dataFile = null) {
        $this->results = new DOMDocument();        
        $this->results->formatOutput = TRUE; // outputs human readable response.
        if($dataFile!=null) { 
            $this->dataSet = new DOMDocument();
            $this->dataSet->load($dataFile);
        }
    }
    
    /*
     * Returns the result object as xml
     */
    function toXML() {
        header(self::TYPE_XML);
        return $this->results->saveXML();
    }
    
    /*
     * Returns the result object as json
     */
    function toJSON() { 
        header(self::TYPE_JSON);
        $xml = simplexml_load_string($this->results->saveXML());
        return json_encode($xml);
    }
    
    /**
     * Used to create error objects to be returned
     * @param Int $id
     * @param String $code
     */
    function error($id, $code) {
        $node = $this->results->createElement("results");
	$resultsNode = $this->results->appendChild($node);
        $errorNode = $this->results->createElement("error");
        $errorNode->setAttribute("id", $id);
        $errorNode->setAttribute("code", $code);
        $resultsNode->appendChild($errorNode);
    }
    
}

?>
