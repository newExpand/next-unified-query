module.exports = {
  // Custom metrics collection
  afterResponse: function(requestParams, response, context, ee, next) {
    // Log slow responses
    if (response.timings && response.timings.phases.firstByte > 1000) {
      console.log(`Slow response: ${requestParams.url} - ${response.timings.phases.firstByte}ms`);
    }
    
    // Track response sizes
    if (response.headers['content-length']) {
      const size = parseInt(response.headers['content-length']);
      ee.emit('counter', 'response.size', size);
    }
    
    return next();
  }
};