'use strict';

const _ = require('lodash');

function createPreloader(list) {
    const urls = _.clone(list);
    return {
        next() {
            return urls.shift();
        }
    };
}

function runPreloadTask(prefetcher, imageCacheManager, onProgress) {
    const url = prefetcher.next();
    if (!url) {
        return Promise.resolve();
    }
    // console.log('START', url);
    return imageCacheManager.downloadAndCacheUrl(url)
        // allow prefetch task to fail without terminating other prefetch tasks
        .catch(() => onProgress(url, false))
        // then run next task
        .then(() => {
            onProgress(url, true)
            return runPreloadTask(prefetcher, imageCacheManager, onProgress)
        });
}

module.exports = {

    /**
     * download and cache an list of urls
     * @param urls
     * @param imageCacheManager
     * @param numberOfConcurrentPreloads
     * @param onProgress
     * @returns {Promise}
     */
    preloadImages(urls, imageCacheManager, numberOfConcurrentPreloads, onProgress) {
        const preloader = createPreloader(urls);
        const numberOfWorkers = numberOfConcurrentPreloads > 0 ? numberOfConcurrentPreloads : urls.length;
        const promises = _.times(numberOfWorkers, () =>
            runPreloadTask(preloader, imageCacheManager, onProgress)
        );
        return Promise.all(promises);
    },

};
