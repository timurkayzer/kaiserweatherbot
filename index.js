const Telegraf = require('telegraf');
const Accuweather = require('accuweather')
const request = require('request-promise')
const session = require('telegraf/session')
const express = require('express')

const botToken = "782533565:AAHMeuReuty_JBuLEG3-jqPhWNGMgi5r8pk"
const accuToken = "mdQgHIAtLVH55uJ4A7g1TfQNw1C8ODL0"
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'Semtember', 'October', 'November', 'December']
//https://developer.accuweather.com/accuweather-locations-api/apis/get/locations/v1/cities/geoposition/search

accuweather = new Accuweather(accuToken)
const bot = new Telegraf(botToken)
bot.use(session())
bot.start((ctx) => ctx.reply('Welcome! Send your location to get weather forecast!'))
bot.help((ctx) => ctx.reply('Send this bot your location to get weather report'))

bot.command('/weather1day',ctx=>{
    ctx.reply('This command does not work currently. Coming soon!')
})

bot.command('/weather5days',ctx=>{
    if(ctx.session.locationKey){

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

                    message = 'Weather in '+ ctx.session.locationName + '\n\n'

                    for (let i in forecastArray) {

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
                        message += forecast.Night.IconPhrase + '\n\n\n'

                    }
                    ctx.replyWithHTML(message)

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
    else{
        ctx.reply('Please, send your location first.')
    }
})

bot.on('location', async (ctx) => {

    const location = ctx.update.message.location

    request({
        method: 'GET',
        uri: `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${accuToken}&q=${location.latitude},${location.longitude}`,
    })
        .then((result) => {
            try {
                console.log(result)
                let resultObject = JSON.parse(result)
                let locationKey = resultObject.Key
                let locationName = resultObject.LocalizedName

                ctx.session.locationKey = locationKey
                ctx.session.locationName = locationName
                ctx.reply('Location saved. Now select one of bot commands.')

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
},30000)

const app = express()

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.launch()