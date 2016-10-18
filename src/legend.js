'use strict';
const TOO_MANY_LAYERS = 12;

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

function assignLayerSplits(layers, splitPoints) {
    layers[0].splitBefore = false;
    splitPoints.forEach((split, i) => layers[i + 1].splitBefore = split);
    return layers;
}

function packLayersIntoSections(layers, sections) {
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
    return assignLayerSplits(layers, bestPerm);
}

function splitLayer(layer, chunkSize) {
    let runningHeight = 0;

    function traverse(items) {
        items.forEach(item => {
            if (runningHeight >= chunkSize) {
                item.splitBefore = true;
                runningHeight = 0;
            }

            // FIXME this doesn't calculate gutters correctly
            runningHeight += item.type === 'group' ? item.headerHeight : item.height;
            if (item.type === 'group') {
                traverse(item.items);
            }
        });
    }

    traverse(layer.items);
    return layer;
}

function allocateLayersToSections(layers, sectionsAvailable) {
    assignLayerSplits(layers, Array(layers.length - 1).fill(true));
    const bestSectionUsage = {}; // maps number of sections used to best height achieved
    bestSectionUsage[layers.length] = {
        height: Math.max(...layers.map(l => l.height)),
        segments: Array(layers.length)
    };
    bestSectionUsage[layers.length].segments.fill(1);

    let curSectionsUsed = layers.length;
    while (curSectionsUsed < sectionsAvailable) {
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

    console.log(curSectionsUsed, bestSectionUsage);

}

function makeLegend(layerList, sectionsAvailable) {
    if (layerList.length > TOO_MANY_LAYERS) {
        return { layerList, sectionsUsed: 1 };
    }
    if (layerList.length <= sectionsAvailable) {
        return allocateLayersToSections(layerList, sectionsAvailable);
    } else {
        return packLayersIntoSections(layerList, sectionsAvailable);
    }
}

module.exports = () => ({ makeLegend, allComb, splitLayer });
