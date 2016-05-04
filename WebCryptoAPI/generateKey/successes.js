// The standard for run_test is to have no parameters, and
// execute all tests. But tests with RSA keys are very, very
// slow, so we give calls an option to provide a list of algorithm
// names to test. If no list is given, all algorithms are tested.
function run_test(algorithmNames) {
    var subtle = crypto.subtle; // Change to test prefixed implementations

    setup({explicit_timeout: true});

// These tests check that generateKey successfully creates keys
// when provided any of a wide set of correct parameters.
//
// There are a lot of combinations of possible parameters,
// resulting in a very large number of tests
// performed.


// Setup: define the correct behaviors that should be sought, and create
// helper functions that generate all possible test parameters for
// different situations.

    var allTestVectors = [ // Parameters that should work for generateKey
        {name: "AES-CTR",  resultType: CryptoKey, usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"], mandatoryUsages: []},
        {name: "AES-CBC",  resultType: CryptoKey, usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"], mandatoryUsages: []},
        {name: "AES-GCM",  resultType: CryptoKey, usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"], mandatoryUsages: []},
        {name: "AES-KW",   resultType: CryptoKey, usages: ["wrapKey", "unwrapKey"], mandatoryUsages: []},
        {name: "HMAC",     resultType: CryptoKey, usages: ["sign", "verify"], mandatoryUsages: []},
        {name: "RSASSA-PKCS1-v1_5", resultType: "CryptoKeyPair", usages: ["sign", "verify"], mandatoryUsages: ["sign"]},
        {name: "RSA-PSS",  resultType: "CryptoKeyPair", usages: ["sign", "verify"], mandatoryUsages: ["sign"]},
        {name: "RSA-OAEP", resultType: "CryptoKeyPair", usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"], mandatoryUsages: ["decrypt", "unwrapKey"]},
        {name: "ECDSA",    resultType: "CryptoKeyPair", usages: ["sign", "verify"], mandatoryUsages: ["sign"]},
        {name: "ECDH",     resultType: "CryptoKeyPair", usages: ["deriveKey", "deriveBits"], mandatoryUsages: ["deriveKey", "deriveBits"]}
    ];

    var testVectors = [];
    allTestVectors.forEach(function(vector) {
        if (!algorithmNames || algorithmNames.includes(vector.name)) {
            testVectors.push(vector);
        }
    });


    function parameterString(algorithm, extractable, usages) {
        var result = "(" +
                        objectToString(algorithm) + ", " +
                        objectToString(extractable) + ", " +
                        objectToString(usages) +
                     ")";

        return result;
    }

    // Test that a given combination of parameters is successful
    function testSuccess(algorithm, extractable, usages, resultType, testTag) {
        // algorithm, extractable, and usages are the generateKey parameters
        // resultType is the expected result, either the CryptoKey object or "CryptoKeyPair"
        // testTag is a string to prepend to the test name.

        promise_test(function(test) {
            return subtle.generateKey(algorithm, extractable, usages)
            .then(function(result) {
                if (resultType === "CryptoKeyPair") {
                    assert_goodCryptoKey(result.privateKey, algorithm, extractable, usages, "private");
                    assert_goodCryptoKey(result.publicKey, algorithm, extractable, usages, "public");
                } else {
                    assert_goodCryptoKey(result, algorithm, extractable, usages, "secret");
                }
            })
            .catch(function(err) {
                assert_unreached("Threw an unexpected error: " + err.toString());
            });
        }, testTag + ": generateKey" + parameterString(algorithm, extractable, usages));
    }


    // Test all valid sets of parameters for successful
    // key generation.
    testVectors.forEach(function(vector) {
        allNameVariants(vector.name).forEach(function(name) {
            var useOnlyShortKeys = (name !== name.toUpperCase()); // Save time on low and mixed case variations
            allAlgorithmSpecifiersFor(name, useOnlyShortKeys).forEach(function(algorithm, useOnlyShortKeys) {
                allValidUsages(vector.usages, false, vector.mandatoryUsages).forEach(function(usages) {
                    [false, true].forEach(function(extractable) {
                        testSuccess(algorithm, extractable, usages, vector.resultType, "Success");
                    });
                });
            });
        });
    });

}
