'use strict'

const svair = require('svair-api')
const StandardError = require('standard-error')
const SvairBanService = require('./../ban/svairBan.service')

function ImpotController (options) {
  options = options || {}
  var svairBanService = new SvairBanService(options)

  this.adress = function (req, res, next) {
    var numeroFiscal = formatNumeroFiscal(req.query.numeroFiscal)
    var referenceAvis = formatReferenceAvis(req.query.referenceAvis)
    if (!numeroFiscal || !referenceAvis) {
      return next(new StandardError('Les paramètres numeroFiscal et referenceAvis doivent être fournis dans la requête.', {code: 400}))
    } else {
      svairBanService.getAdress(numeroFiscal, referenceAvis, (err, data) => {
        if (err) return next(err)
        res.data = data
        return next()
      })
    }
  }

  function sendDataFromSvair (err, result, next, res) {
    if (err && err.message === 'Invalid credentials') {
      next(new StandardError('Les paramètres fournis sont incorrects ou ne correspondent pas à un avis', {code: 404}))
    } else if (err) {
      next(new StandardError(err.message, {code: 500}))
    } else {
      res.data = result
      return next()
    }
  }

  function formatNumeroFiscal (numeroFiscal) {
    return (numeroFiscal || '').replace(' ', '').substring(0, 13)
  }

  function formatReferenceAvis (referenceAvis) {
    return (referenceAvis || '').replace(' ', '')
  }

  this.svair = function (req, res, next) {
    var numeroFiscal = formatNumeroFiscal(req.query.numeroFiscal)
    var referenceAvis = formatReferenceAvis(req.query.referenceAvis)
    if (!numeroFiscal || !referenceAvis) {
      return next(new StandardError('Les paramètres numeroFiscal et referenceAvis doivent être fournis dans la requête.', {code: 400}))
    } else {
      svair(options.svairHost)(numeroFiscal, referenceAvis, function (err, result) {
        sendDataFromSvair(err, result, next, res)
      })
    }
  }

  this.ping = function (req, res, next) {
    var numeroFiscal = options.numeroFiscal
    var referenceAvis = options.referenceAvis
    if (!numeroFiscal || !referenceAvis) {
      return next(new StandardError('Les paramètres numeroFiscal et referenceAvis doivent être fournis dans la requête.', {code: 400}))
    } else {
      svair(options.svairHost)(numeroFiscal, referenceAvis, function (err) {
        sendDataFromSvair(err, 'pong', next, res)
      })
    }
  }

  this.authorize = function (req, res, next) {
    if (req.authType === 'FranceConnect') {
      if (this.consumerMatch(req, res)) {
        return next()
      } else {
        return next(
          new StandardError(
            'You are forbidden to access this resource',
            {code: 403}
          )
        )
      }
    } else {
      return next()
    }
  }

  this.consumerMatch = function (req, res) {
    const impotsNames = upcaseImpotsNames(res)
    const consumerName = req.consumer.name.toUpperCase()

    return impotsNames.indexOf(consumerName) !== -1
  }

  function upcaseImpotsNames (res) {
    let names = [
      res.data.declarant1.prenoms.split(' ')[0] + ' ' + res.data.declarant1.nom,
      res.data.declarant2.prenoms.split(' ')[0] + ' ' + res.data.declarant2.nom
    ]
    return names.map((name) => name.toUpperCase())
  }
}

module.exports = ImpotController
