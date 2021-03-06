import * as $ from 'jquery';
import { of, range, race, concat, merge, defer } from 'rxjs'
import { flatMap, take, tap, } from 'rxjs/operators'
import { requestAnimation, awaitAnimation, modelAnimation, responseAnimation, peekAnimation, filterAnimation, } from './common/animations';
import { request, server, responseContent } from './common/elements';
import { startTimer, increaseMemoryUsage, decreaseMemoryUsage, increaseProcessedElementsCount } from './common/statistic';
import { ELEMENTS_TO_FIND, NETWORK_THROUGHPUT, ELEMENTS_COUNT } from './common/constants';


const runnableAction = () => {
  const timerStopper = startTimer();

  concat(
    requestAnimation(request[0]),
    race(
      awaitAnimation(server.toArray()),
      // Generate Items
      range(0, ELEMENTS_COUNT).pipe( 
        flatMap(() => {
          const el = $('<div class="stretched el"></div>').appendTo(responseContent)[0];
          
          // the async item's generation process
          return concat(modelAnimation(el), of(el)); 
        }, 1),
      )
    ).pipe(
      // network latency simmulation with limited bandwidth
      flatMap((el) => concat(responseAnimation(el), of(el)), NETWORK_THROUGHPUT), 
      // Memory Control
      tap((e) => increaseMemoryUsage()),
      // Animated Filtering Process
      flatMap(el => {
        const shouldFilter = Math.random() >= 0.5;

        if (shouldFilter) {
          return concat(
            merge(
              peekAnimation(el),
              filterAnimation(el),
            ),
            defer(decreaseMemoryUsage),
          );
        } else {
          return concat(
            peekAnimation(el),
            defer(decreaseMemoryUsage),
            of(el)
          );
        }
      }, 1),
      take(ELEMENTS_TO_FIND),
    ),
  ).subscribe(increaseProcessedElementsCount, timerStopper, timerStopper);
}

export default runnableAction;