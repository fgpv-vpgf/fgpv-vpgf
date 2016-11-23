'use strict';
const TOO_MANY_LAYERS = 15;

/**
 * Generate all permutations of length M, with exactly N `true` values.
 *
 * @function
 * @param {int} M the size of the array (must be greater than 0)
 * @param {int} N the number of entries which should be true (must not be greater than M)
 * @return an array containing all possible size M arrays of boolean values with N true entries
 */
function allComb(M, N) {
    const maxTrue = N;
    const maxFalse = M - N;
    const C = [[[[]]]]; // C[m][n] is the solution to all_comb(m,n), C[0][0] starts with an empty array
    for (let m = 1; m <= M; ++m) {
        C[m] = [];
        for (let n = 0; n <= m; ++n) {
            // if this would place more than the max number of true or false values we don't need this part of the array
            if (n > maxTrue || (m - n) > maxFalse) { continue; }

            const a = n > 0 ? C[m - 1][n - 1].map(x => x.concat(true)) : [];
            const b = m > n ? C[m - 1][n].map(x => x.concat(false)) : [];

            C[m][n] = a.concat(b);
        }
    }
    return C[M][N];
}

/**
 * Convenience function for assigning the `splitBefore` property on layers at specified points.
 * NOTE: this function modifies data in place
 * @function
 * @private
 * @param {Array} layers a list of layers to be updated (modified in place)
 * @param {Array} splitPoints an array of boolean values indicating if the layer list should be split at that point (must be layers.length-1 in size)
 * @return layers the same array as passed in
 */
function assignLayerSplits(layers, splitPoints) {
    layers[0].splitBefore = false;
    splitPoints.forEach((split, i) => layers[i + 1].splitBefore = split);
    return layers;
}

/**
 * Groups multiple layers into each section while attempting to minimize the legend height.
 * Allocates to the exact number specified in the `sections` argument. 
 * NOTE: don't call this with too many layers as it tests all possible groupings and can be
 * computationally expensive (< 15 layers should be fine)
 * @function
 * @private
 * @param {Array} layers a list of layers to be updated (modified in place)
 * @param {int} sections the number of sections to use
 * @return an object in the form { layers, sectionsUsed, bestPerm, bestHeight }
 */
function packLayersIntoExactSections(layers, sections) {
    const potentialSplits = layers.length - 1;
    const requiredSplits = sections - 1;

    const permutations = allComb(potentialSplits, requiredSplits);
    let bestHeight = Number.MAX_VALUE;
    let bestPerm = null;
    const heights = Array(sections);

    permutations.forEach(perm => {
        heights.fill(0);
        let curSec = 0;
        layers.forEach((l, i) => {
            heights[curSec] += l.height;
            if (perm[i]) {
                ++curSec;
            }
        });
        const h = Math.max(...heights);
        if (h <= bestHeight) {
            bestHeight = h;
            bestPerm = perm;
        }
    });
    return { layers, sectionsUsed: sections, bestPerm, bestHeight };
}

/**
 * Groups multiple layers into each section while attempting to minimize the legend height.
 * Repeats as necessary to use the least number of sections while still keeping the resulting
 * legend height within 20% of optimal.
 * NOTE: don't call this with too many layers as it tests all possible groupings and can be
 * computationally expensive (< 15 layers should be fine)
 * @function
 * @private
 * @param {Array} layers a list of layers to be updated (modified in place)
 * @param {int} sections the number of sections to use
 * @return an object in the form { layers, sectionsUsed }
 */
function packLayersIntoOptimalSections(layers, sections) {
    let bestHeight = Number.MAX_VALUE;
    let bestPerm = null;
    let sectionsUsed = -1;
    for (let n = sections; n > 1; --n) {
        const { bestPerm: perm, bestHeight: height } = packLayersIntoExactSections(layers, n);
        if (height * 0.8 > bestHeight) {
            break;
        } else if (height <= bestHeight) {
            [bestHeight, bestPerm, sectionsUsed] = [height, perm, n];
        }
    }
    assignLayerSplits(layers, bestPerm);
    return { layers, sectionsUsed };
}

/**
 * Split a layer into `splitCount` parts of roughly equal size.
 * @function
 * @private
 * @param {Object} layer a layer object to be split into `splitCount` parts
 * @param {int} chunkSize the maximum height in pixels of the legend sections
 * @param {int} splitCount the number of pieces which the layer should be broken into
 * @return an object with properties whiteSpace: <int>, splits: [ <layerItems> ]
 */
function splitLayer(layer, chunkSize, splitCount) {
    let itemYOffset = layer.y;
    let itemYMax = 0;
    const splits = [];
    const splitSizes = Array(splitCount).fill(0);

    function traverse(items) {
        items.forEach(item => {

            if (splitCount === 1) {
                return;
            }

            splitSizes[splitCount - 1] = itemYMax - itemYOffset; // bottom of current item - offset at current section start

            // this is the y coordinate of the item's bottom boundary
            itemYMax = item.y + (item.type === 'group' ? item.headerHeight : item.height);

            if (itemYMax - itemYOffset >= chunkSize) {
                splitCount--;

                // whitespace is created when an item sitting on the boundary pulled into the next chunk, the space
                // it would have occupied is wasted; the waste doubles as the entire item is moved to the next legend chunk
                itemYOffset = item.y;
                splits.push(item);
            }

            if (item.type === 'group') {
                traverse(item.items);
            }
        });
    }

    traverse(layer.items);
    splitSizes[splitCount - 1] = layer.height - (itemYOffset - layer.y); // bottom of layer - start of last section; start of last section = total offset of last section - offset at start of layer

    // with whiteSpace we want to find the difference between the chunkSize and used space
    // for each section used (whiteSpace may be negative indicating that a section is
    // spilling past the target size); the total amount of whiteSpace is a measure of how
    // bad the layer allocation was
    return { whiteSpace: splitSizes.reduce((a, b) => a + Math.abs(chunkSize - b), 0), splits };
}

/**
 * Find the optimal split points for the given layer.
 * @function
 * @private
 * @param {Object} layer a layer object to be split into `splitCount` parts
 * @param {int} splitCount the number of pieces which the layer should be broken into
 * @return a reference to the layer passed in
 */
function findOptimalSplit(layer, splitCount) {
    if (splitCount === 1) {
        return layer;
    }

    let chunkSize = layer.height / splitCount; // get initial chunk size for starters

    // get initial splits and whitespace with initial chunk size; this will serve to determine the steps at which the chunk size will be increased
    let { splits: minSplits, whiteSpace: minWhiteSpace } = splitLayer(layer, chunkSize, splitCount);

    const stepCount = 8; // number of attempts
    const step = minWhiteSpace / stepCount;

    // calculate splits while increasing the chunk size
    for (let i = 1; i <= stepCount; i++) {
        chunkSize += step;

        let { splits, whiteSpace } = splitLayer(layer, chunkSize, splitCount);

        // store splits corresponding to the minimum whitespace
        if (whiteSpace < minWhiteSpace) {
            minWhiteSpace = whiteSpace;
            minSplits = splits;
        }
    }

    // apply split to the splits that result in the minimum of whitespace
    minSplits.forEach(split => split.splitBefore = true);
    return layer;
}

/**
 * @function
 * @private
 * @param {Array} layers a list of layers to be updated (modified in place)
 * @param {int} sectionsAvailable the maximum number of sections to use
 * @param {int} mapHeight the rendered height of the map image
 * @return the same layers array as passed in
 */
function allocateLayersToSections(layers, sectionsAvailable, mapHeight) {
    assignLayerSplits(layers, Array(layers.length - 1).fill(true));
    const bestSectionUsage = {}; // maps number of sections used to best height achieved
    bestSectionUsage[layers.length] = {
        height: Math.max(...layers.map(l => l.height)),
        segments: Array(layers.length)
    };
    bestSectionUsage[layers.length].segments.fill(1);

    let curSectionsUsed = layers.length;
    while (curSectionsUsed < sectionsAvailable && bestSectionUsage[curSectionsUsed].height > mapHeight * 2) {
        const oldSegments = bestSectionUsage[curSectionsUsed].segments;
        const normalizedLayers = oldSegments.map((seg, i) => layers[i].height / seg);
        const worstLayerIndex = normalizedLayers.indexOf(Math.max(...normalizedLayers));
        const newSegments = oldSegments.map((seg, i) => i === worstLayerIndex ? seg + 1 : seg);
        ++curSectionsUsed;
        bestSectionUsage[curSectionsUsed] = {
            height: Math.max(...newSegments.map((seg, i) => layers[i].height / seg)),
            segments: newSegments
        };
    }
    while (curSectionsUsed > layers.length) {
        if (bestSectionUsage[curSectionsUsed].height < 0.9 * bestSectionUsage[curSectionsUsed - 1].height) {
            break;
        }
        --curSectionsUsed;
    }
    layers.forEach((l, i) => findOptimalSplit(l, bestSectionUsage[curSectionsUsed].segments[i]));
    return { layers, sectionsUsed: curSectionsUsed };
}

/**
 * Generate the structure for a legend given a set of layers.
 * @function
 * @param {Array} layerList a list of layers to be updated (modified in place)
 * @param {int} sectionsAvailable the maximum number of sections to use
 * @param {int} mapHeight the rendered height of the map image
 * @return an object with properties layers, sectionsUsed. (layerList is modified in place)
 */
function makeLegend(layerList, sectionsAvailable, mapHeight) {
    if (layerList.length > TOO_MANY_LAYERS) {
        const layersPerSection = Math.ceil(layerList.length / sectionsAvailable);
        const splitPoints = Array(layerList.length - 1).fill(0).map((v, i) => (i + 1) % layersPerSection === 0); // I don't know why the useless fill is necessary
        assignLayerSplits(layerList, splitPoints);
        return { layers: layerList, sectionsUsed: sectionsAvailable };
    }
    if (layerList.length <= sectionsAvailable) {
        return allocateLayersToSections(layerList, sectionsAvailable, mapHeight);
    } else {
        return packLayersIntoOptimalSections(layerList, sectionsAvailable);
    }
}

module.exports = () => ({ makeLegend, allComb, splitLayer, findOptimalSplit });
