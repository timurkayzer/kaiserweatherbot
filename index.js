const Telegraf = require('telegraf');
const Accuweather = require('accuweather')
const request = require('request-promise')
const session = require('telegraf/session')

const botToken = "782533565:AAHMeuReuty_JBuLEG3-jqPhWNGMgi5r8pk"
const accuToken = "mdQgHIAtLVH55uJ4A7g1TfQNw1C8ODL0"
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'Semtember', 'October', 'November', 'December']
//https://developer.accuweather.com/accuweather-locations-api/apis/get/locations/v1/cities/geoposition/search

accuweather = new Accuweather(accuToken)
const bot = new Telegraf(botToken)
bot.use(session())
bot.start((ctx) => ctx.reply('Welcome! Send your location to get weather forecast!'))
bot.help((ctx) => ctx.reply('Send this bot your location to get weather report'))


bot.command('weather',async (ctx)=>{
    if( (typeof ctx.session.locationKey) !== 'undefined'){

        let locationKey = ctx.session.locationKey
        request({
            method: 'GET',
            uri: `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${accuToken}&metric=true`
        })
            .then(async (result) => {
                try {
                    let results = JSON.parse(result)

                    let message

                    let forecastArray = []

                    for (let i in results.DailyForecasts) {
                        forecastArray.pop(results.DailyForecasts[i])
                    }



                    for (let i in forecastArray) {

                        message = ''

                        let forecast = results.DailyForecasts[i]
                        let date = new Date(Number.parseInt(`${forecast.EpochDate}000`))
                        let dateString = date.getDate() + ' ' + months[date.getMonth()]

                        message += `<b>${dateString}</b>\n\n`

                        message += 'Temperature:\n'
                        message += forecast.Temperature.Minimum.Value + ' ' + forecast.Temperature.Minimum.Unit + ' - ' +
                            forecast.Temperature.Maximum.Value + ' ' + forecast.Temperature.Maximum.Unit + '\n\n'

                        message += 'Day:\n'
                        message += forecast.Day.IconPhrase + '\n\n'

                        message += 'Night:\n'
                        message += forecast.Night.IconPhrase

                        await ctx.replyWithHTML(message)
                    }
                }
                catch (e) {
                    console.log(e)
                    ctx.reply('Sorry, service is currently not awailable. Please try later.')
                }
                console.log(JSON.parse(result))
            })
            .catch((e) => {
                console.log(e)
                ctx.reply('Sorry, service is currently not awailable. Please try later.')
            })
    }
    else
        ctx.reply('First send your location, please')

})

bot.on('location', async (ctx) => {

    const location = ctx.update.message.location

    request({
        method: 'GET',
        uri: `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${accuToken}&q=${location.latitude},${location.longitude}`,
    })
        .then((result) => {
            try {
                let resultObject = JSON.parse(result)
                let locationKey = resultObject.Key

                ctx.session.locationKey = locationKey
                ctx.reply('Now you can type /weather to see weather in your current city')

                request({
                    method: 'GET',
                    uri: `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${accuToken}&metric=true`
                })
                    .then(async (result) => {
                        try {
                            let results = JSON.parse(result)

                            let message

                            let forecastArray = []

                            /*for (let i in results.DailyForecasts) {
                                forecastArray.pop(results.DailyForecasts[i])
                            }*/

                            forecastArray = results.DailyForecasts
                            forecastArray = forecastArray.reverse()

                            let temp
                            for(let i in forecastArray){
                                for(let j in forecastArray ){
                                    if(Number.parseInt(forecastArray[i].EpochDate) < Number.parseInt(forecastArray[j].EpochDate)){
                                        temp = forecastArray[j]
                                        forecastArray[j] = forecastArray[i]
                                        forecastArray[i] = temp
                                    }
                                }
                            }

                            for (let i in forecastArray) {

                                message = ''

                                let forecast = results.DailyForecasts[i]
                                let date = new Date(Number.parseInt(`${forecast.EpochDate}000`))
                                let dateString = date.getDate() + ' ' + months[date.getMonth()]

                                message += `<b>${dateString}</b>\n\n`

                                message += '🌡  Temperature:\n'
                                message += forecast.Temperature.Minimum.Value + ' ' + forecast.Temperature.Minimum.Unit + ' - ' +
                                    forecast.Temperature.Maximum.Value + ' ' + forecast.Temperature.Maximum.Unit + '\n\n'

                                message += '🌞 <b>Day</b>:\n'
                                message += forecast.Day.IconPhrase + '\n\n'

                                message += '🌛 <b>Night</b>:\n'
                                message += forecast.Night.IconPhrase

                                await ctx.replyWithHTML(message)
                            }
                        }
                        catch (e) {
                            console.log(e)
                            ctx.reply('Sorry, service is currently not awailable. Please try later.')
                        }
                        console.log(JSON.parse(result))
                    })
                    .catch((e) => {
                        console.log(e)
                        ctx.reply('Sorry, service is currently not awailable. Please try later.')
                    })


            }
            catch (e) {
                console.log(e)
                ctx.reply('Sorry, service is currently not awailable. Please try later.')
            }
        })
        .catch((e) => {
            console.log(e);
            ctx.reply('Sorry, service is currently not awailable. Please try later.')
        })
})


setInterval(async ()=>{
    await request({
        method:'GET',
        uri:'https://kaiserweatherbot.herokuapp.com/'
    })
},200000)

bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.launch()