/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// CloudFront Function (runtime cloudfront-js-2.0), associated with the
// viewer-request event of the default cache behaviour.
//
// The deploy workflow uploads every /assets/*.js and /assets/*.css file three
// times: raw, as `<file>.br` (Content-Encoding: br) and as `<file>.gz`
// (Content-Encoding: gzip). This function rewrites the request to the best
// encoding the viewer accepts. It runs before the cache lookup, so each encoding
// is cached under its own key and the cache policy does not need to vary on
// Accept-Encoding.
//
// Only enable it after at least one deploy has uploaded the .br/.gz copies,
// otherwise requests for assets without siblings will 404.

function acceptsEncoding(header, encoding) {
  return header.split(',').some(function (part) {
    var token = part.trim().split(';');
    if (token[0].trim().toLowerCase() !== encoding) {
      return false;
    }
    var q = token.length > 1 ? token[1].trim() : '';
    return q !== 'q=0' && q !== 'q=0.0';
  });
}

function handler(event) {
  var request = event.request;
  if (!request.uri.startsWith('/assets/') || !/\.(js|css)$/.test(request.uri)) {
    return request;
  }
  var header = request.headers['accept-encoding'];
  var accepted = header ? header.value : '';
  if (acceptsEncoding(accepted, 'br')) {
    request.uri += '.br';
  } else if (acceptsEncoding(accepted, 'gzip')) {
    request.uri += '.gz';
  }
  return request;
}
