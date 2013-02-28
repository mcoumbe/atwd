<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of Api
 *
 * @author Mike
 */
include_once 'BooksByCourse.php';
include_once 'BookDetails.php';
include_once 'Suggestions.php';
include_once 'BorrowBook.php';

class Api {

    static function getBooksByCourseXML($courseId) {
        $response = new BooksByCourse($courseId);
        echo $response->toXML();
    }

    static function getBooksByCourseJSON($courseId) {
        $response = new BooksByCourse($courseId);
        echo $response->toJSON();
    }

    static function getBookDetailsXML($itemId) {
        $response = new BookDetails($itemId);
        echo $response->toXML();
    }

    static function getBookDetailsJSON($itemId) {
        $response = new BookDetails($itemId);
        echo $response->toJSON();
    }

    static function getSuggestionsXML($itemId) {
        $response = new Suggestions($itemId);
        echo $response->toXML();
    }

    static function getSuggestionsJSON($itemId) {
        $response = new Suggestions($itemId);
        echo $response->toJSON();
    }

    static function postBorrow() {
        $itemId = (isset($_POST['itemId'])) ? $_POST['itemId'] : 0;        
        $response = new BorrowBook($itemId);
        echo $response->toJSON();        
    }

    static function invalidPath() {
        $response = new WSResponse();
        $response->error(WSResponse::INVALID_PATTERN_ID, WSResponse::INVALID_PATTERN_CODE);
        echo $response->toXML();
    }
    
    static function exception() {
        $response = new WSResponse();
        $response->error(WSResponse::SERVICE_ERROR_ID, WSResponse::SERVICE_ERROR_CODE);
        echo $response->toXML();
    }

    /*

      $app->post('/borrow', function () use ($app) {
      $postData = $app->request()->post();
      $response = new BorrowBook($postData);
      echo $response->toXML();
      });

      $app->error(function (\Exception $e) use ($app) {
      $response = new WSResponse();
      $response->error(WSResponse::SERVICE_ERROR_ID, WSResponse::SERVICE_ERROR_CODE);
      echo $response->toXML();
      });

      $app->notFound(function () use ($app) {
      $response = new WSResponse();
      $response->error(WSResponse::INVALID_PATTERN_ID, WSResponse::INVALID_PATTERN_CODE);
      echo $response->toXML();
      });
     */
}

?>
