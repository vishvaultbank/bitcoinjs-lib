var assert = require('assert')
var crypto = require('../src/crypto')
var networks = require('../src/networks')
var templates = require('../src/templates')

var Address = require('../src/address')
var ECPubKey = require('../src/ecpubkey')
var Script = require('../src/script')

var fixtures = require('./fixtures/script.json')

function b2h(b) { return new Buffer(b).toString('hex') }
function h2b(h) { return new Buffer(h, 'hex') }

describe('Templates', function() {
  describe('classifyScriptSig', function() {
    fixtures.valid.forEach(function(f) {
      if (f.scriptPubKey) return

      it('supports ' + f.type, function() {
        var script = Script.fromHex(f.hex)
        var type = templates.classifyScriptSig(script)

        assert.equal(type, f.type)
      })
    })
  })

  describe('classifyScriptPubKey', function() {
    fixtures.valid.forEach(function(f) {
      if (!f.scriptPubKey) return

      it('supports ' + f.type, function() {
        var script = Script.fromHex(f.hex)
        var type = templates.classifyScriptPubKey(script)

        assert.equal(type, f.type)
      })
    })
  })

  // FIXME: bad
  describe('pay-to-pubKeyHash', function() {
    it('matches the test data', function() {
      var f = fixtures.valid[2]
      var address = Address.fromBase58Check('19E6FV3m3kEPoJD5Jz6dGKdKwTVvjsWUvu')
      var script = templates.createPubKeyHashScriptPubKey(address.hash)

      assert.equal(script.toHex(), f.hex)
    })
  })

  // FIXME: bad
  describe('pay-to-pubkey', function() {
    it('matches the test data', function() {
      var f = fixtures.valid[0]
      var pubKey = ECPubKey.fromHex(f.pubKey)
      var script = templates.createPubKeyScriptPubKey(pubKey)

      assert.equal(script.toHex(), f.hex)
    })
  })

  // FIXME: bad
  describe('pay-to-scriptHash', function() {
    it('matches the test data', function() {
      var f = fixtures.valid[1]
      var address = Address.fromBase58Check('3NukJ6fYZJ5Kk8bPjycAnruZkE5Q7UW7i8')
      var script = templates.createP2SHScriptPubKey(address.hash)

      assert.equal(script.toHex(), f.hex)
    })
  })

  // FIXME: bad
  describe('2-of-3 Multi-Signature scriptPubKey', function() {
    var pubKeys

    beforeEach(function() {
      pubKeys = [
        '02ea1297665dd733d444f31ec2581020004892cdaaf3dd6c0107c615afb839785f',
        '02fab2dea1458990793f56f42e4a47dbf35a12a351f26fa5d7e0cc7447eaafa21f',
        '036c6802ce7e8113723dd92cdb852e492ebb157a871ca532c3cb9ed08248ff0e19'
      ].map(ECPubKey.fromHex)
    })

    it('should create valid redeemScript', function() {
      var redeemScript = templates.createMultisigScriptPubKey(2, pubKeys)

      var hash160 = crypto.hash160(new Buffer(redeemScript.buffer))
      var multisigAddress = new Address(hash160, networks.bitcoin.scriptHash)

      assert.equal(multisigAddress.toString(), '32vYjxBb7pHJJyXgNk8UoK3BdRDxBzny2v')
    })

    it('should throw on not enough pubKeys provided', function() {
      assert.throws(function() {
        templates.createMultisigScriptPubKey(4, pubKeys)
      }, /Not enough pubKeys provided/)
    })
  })

  // FIXME: bad
  describe('2-of-2 Multisig scriptSig', function() {
    var pubKeys = [
      '02359c6e3f04cefbf089cf1d6670dc47c3fb4df68e2bad1fa5a369f9ce4b42bbd1',
      '0395a9d84d47d524548f79f435758c01faec5da2b7e551d3b8c995b7e06326ae4a'
    ].map(ECPubKey.fromHex)
    var signatures = [
      '304402207515cf147d201f411092e6be5a64a6006f9308fad7b2a8fdaab22cd86ce764c202200974b8aca7bf51dbf54150d3884e1ae04f675637b926ec33bf75939446f6ca2801',
      '3045022100ef253c1faa39e65115872519e5f0a33bbecf430c0f35cf562beabbad4da24d8d02201742be8ee49812a73adea3007c9641ce6725c32cd44ddb8e3a3af460015d140501'
    ].map(h2b)
    var expected = '0047304402207515cf147d201f411092e6be5a64a6006f9308fad7b2a8fdaab22cd86ce764c202200974b8aca7bf51dbf54150d3884e1ae04f675637b926ec33bf75939446f6ca2801483045022100ef253c1faa39e65115872519e5f0a33bbecf430c0f35cf562beabbad4da24d8d02201742be8ee49812a73adea3007c9641ce6725c32cd44ddb8e3a3af460015d14050147522102359c6e3f04cefbf089cf1d6670dc47c3fb4df68e2bad1fa5a369f9ce4b42bbd1210395a9d84d47d524548f79f435758c01faec5da2b7e551d3b8c995b7e06326ae4a52ae'

    it('should create a valid P2SH multisig scriptSig', function() {
      var redeemScript = templates.createMultisigScriptPubKey(2, pubKeys)
      var redeemScriptSig = templates.createMultisigScriptSig(signatures)

      var scriptSig = templates.createP2SHScriptSig(redeemScriptSig, redeemScript)

      assert.equal(b2h(scriptSig.buffer), expected)
    })

    it('should throw on not enough signatures', function() {
      var redeemScript = templates.createMultisigScriptPubKey(2, pubKeys)

      assert.throws(function() {
        templates.createMultisigScriptSig(signatures.slice(1), redeemScript)
      }, /Not enough signatures provided/)
    })
  })
})
