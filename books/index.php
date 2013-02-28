<?php
/* Main Application, the htdocs file will route all requests though this script.
 * The script is responsible for setting up the available routes and configuring
 * error pages.
 * 
 * The project uses the route package of the Epiphany framework in order to handle
 * the basics of a restful web service.
 */

include_once 'Epi/Epi.php';
include_once 'Api.php';
include_once 'BookDetails.php';

Epi::init('route');
Epi::setSetting('exceptions', true);

/* Sets up the available routes of the application
 */
getRoute()->get('/course/(\w*)/xml', array('Api', 'getBooksByCourseXML'));
getRoute()->get('/course/(\w*)/json', array('Api', 'getBooksByCourseJSON'));
getRoute()->get('/detail/(\w*)/xml', array('Api', 'getBookDetailsXML'));
getRoute()->get('/detail/(\w*)/json', array('Api', 'getBookDetailsJSON'));
getRoute()->get('/suggestions/(\w*)/xml', array('Api', 'getSuggestionsXML'));
getRoute()->get('/suggestions/(\w*)/json', array('Api', 'getSuggestionsJSON'));
getRoute()->get('.*', array('Api', 'invalidPath'));
getRoute()->post('/borrow', array ('Api', 'postBorrow'));


try {
    // Activates the routes and processes the request
    getRoute()->run();
} catch (Exception $e) {
    // Catches all exceptions and returns them as internal service errors
    echo Api::exception();
}

/*

Old implementation from the slim framework.

// Specify valid paths
$app->get('/course/:courseId/xml', function ($courseId) {
    $response = new BooksByCourse($courseId); 
    echo $response->toXML();
});

$app->get('/course/:courseId/json', function ($courseId) {
    $response = new BooksByCourse($courseId); 
    echo $response->toJson();
});

$app->get('/detail/:itemId/xml', function ($itemId) {
    $response = new BookDetails($itemId);
    echo $response->toXML();
});

$app->get('/detail/:itemId/json', function ($itemId) {
    $response = new BookDetails($itemId);
    echo $response->toJson();
});

$app->get('/suggestions/:itemId/xml', function ($itemId) {
    $response = new Suggestions($itemId);
    echo $response->toXML();
});

$app->get('/suggestions/:itemId/json', function ($itemId) {
    $response = new Suggestions($itemId);
    echo $response->toJSON();
});

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

$app->run();
 * 
 * */

?>