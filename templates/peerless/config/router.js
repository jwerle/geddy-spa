/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/


var router = new geddy.RegExpRouter();

/* 
  Routes
*/
router.get('/').to('Main.index');

/* 
  Routing Variables
    subject : Subject namespace
    control : Subject controller
    action  : Subject action
    data    : Subject data
    $1 - $5 : Subject arguments
*/
router.get('/(:subject)(/:control)(/:action)(/:data)(/:$1)(/:$2)(/:$3)(/:$4)(/:$5)').to('Spa.index');


exports.router = router;
