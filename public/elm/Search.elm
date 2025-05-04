
module Search exposing (main)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Http
import Json.Decode as Decode exposing (Decoder)

type alias Tweet =
    { id : String
    , text : String
    , timestamp : String
    , url : String
    , userId : String
    , screenName : String
    }

type alias Model =
    { query : String
    , tweets : List Tweet
    , error : Maybe String
    }

type Msg
    = UpdateQuery String
    | Search
    | Clear
    | GotTweets (Result Http.Error (List Tweet))

init : () -> (Model, Cmd Msg)
init _ =
    ( { query = "", tweets = [], error = Nothing }
    , Cmd.none
    )

tweetDecoder : Decoder Tweet
tweetDecoder =
    Decode.map6 Tweet
        (Decode.field "id" Decode.string)
        (Decode.field "text" Decode.string)
        (Decode.field "timestamp" Decode.string)
        (Decode.field "url" Decode.string)
        (Decode.field "user_id" Decode.string)
        (Decode.field "screen_name" Decode.string)

searchTweets : String -> Cmd Msg
searchTweets query =
    Http.get
        { url = "/api/search?q=" ++ query
        , expect = Http.expectJson GotTweets (Decode.list tweetDecoder)
        }

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case msg of
        UpdateQuery newQuery ->
            ( { model | query = newQuery }, Cmd.none )

        Search ->
            ( model, searchTweets model.query )
            
        Clear ->
            ( { model | query = "", tweets = [], error = Nothing }, Cmd.none )

        GotTweets (Ok tweets) ->
            ( { model | tweets = tweets, error = Nothing }, Cmd.none )

        GotTweets (Err _) ->
            ( { model | error = Just "Failed to fetch tweets" }, Cmd.none )

view : Model -> Html Msg
view model =
    div [ class "mb-6" ]
        [ div [ class "flex items-center gap-2 mb-4" ]
            [ input 
                [ type_ "text"
                , placeholder "Search tweets..."
                , value model.query
                , onInput UpdateQuery
                , class "flex-1 p-3 border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition duration-150 ease-in-out shadow-sm hover:border-blue-300"
                ] []
            , div [ class "flex gap-2" ]
                [ button 
                    [ onClick Search
                    , class "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
                    ] 
                    [ text "Search" ]
                , button 
                    [ onClick Clear
                    , class "bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
                    ] 
                    [ text "Clear" ]
                ]
            ]
        , viewResults model
        ]

viewResults : Model -> Html Msg
viewResults model =
    case model.error of
        Just error ->
            div [ class "text-red-500 p-4 rounded-lg bg-red-50" ] [ text error ]
        
        Nothing ->
            div [ class "space-y-4" ] 
                (List.map viewTweet model.tweets)

viewTweet : Tweet -> Html Msg
viewTweet tweet =
    div [ class "border rounded-lg p-4 hover:bg-gray-50 transition duration-150 ease-in-out" ]
        [ div [ class "mb-2" ]
            [ a [ href ("https://twitter.com/" ++ tweet.screenName)
                , target "_blank"
                , class "text-sm text-blue-600 hover:text-blue-700 transition-colors"
                ] 
                [ text ("@" ++ tweet.screenName) ]
            ]
        , div [ class "text-gray-700 mb-2" ] [ text tweet.text ]
        , div [ class "text-sm flex items-center justify-between" ]
            [ a [ href tweet.url
                , target "_blank"
                , class "bg-blue-500 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600 transition-colors inline-flex items-center gap-1"
                ] 
                [ text "View Tweet" ]
            , span [ class "text-xs text-gray-500" ] [ text tweet.timestamp ]
            ]
        ]

main : Program () Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , view = view
        , subscriptions = \_ -> Sub.none
        }
