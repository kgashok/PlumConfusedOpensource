
module Search exposing (Model, Msg, Tweet, main, view)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Http
import Json.Decode as Decode exposing (Decoder)
import Process
import Task

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
    , searchId : Int
    , isSearching : Bool
    }

type Msg
    = UpdateQuery String
    | Search
    | Clear
    | GotTweets (Result Http.Error (List Tweet))
    | PerformSearch Int
    | DelayedSearch

init : () -> (Model, Cmd Msg)
init _ =
    ( { query = "", tweets = [], error = Nothing, searchId = 0, isSearching = False }
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
    if String.trim query == "" then
        Cmd.none
    else
        Http.get
            { url = "/api/search?q=" ++ query
            , expect = Http.expectJson GotTweets (Decode.list tweetDecoder)
            }

debounceDelay : Float
debounceDelay = 300

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case msg of
        UpdateQuery newQuery ->
            let
                newSearchId = model.searchId + 1
                trimmedQuery = String.trim newQuery
            in
            if trimmedQuery == "" then
                ( { model | query = newQuery, tweets = [], error = Nothing, searchId = newSearchId, isSearching = False }
                , Cmd.none
                )
            else
                ( { model | query = newQuery, searchId = newSearchId, isSearching = True }
                , Task.perform (\_ -> PerformSearch newSearchId) (Process.sleep debounceDelay)
                )

        PerformSearch searchId ->
            if searchId == model.searchId then
                ( model, searchTweets model.query )
            else
                ( model, Cmd.none )

        Search ->
            ( { model | isSearching = True }, searchTweets model.query )
            
        Clear ->
            ( { model | query = "", tweets = [], error = Nothing, searchId = model.searchId + 1, isSearching = False }, Cmd.none )

        GotTweets (Ok tweets) ->
            ( { model | tweets = tweets, error = Nothing, isSearching = False }, Cmd.none )

        GotTweets (Err _) ->
            ( { model | error = Just "Failed to fetch tweets", isSearching = False }, Cmd.none )

        DelayedSearch ->
            ( model, searchTweets model.query )

view : Model -> Html Msg
view model =
    div [ class "mb-6" ]
        [ div [ class "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4" ]
            [ div [ class "relative flex-1" ]
                [ input 
                    [ type_ "text"
                    , placeholder "Search tweets (live search enabled)..."
                    , value model.query
                    , onInput UpdateQuery
                    , class "w-full p-3 border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition duration-150 ease-in-out shadow-sm hover:border-blue-300"
                    ] []
                , if model.isSearching then
                    div [ class "absolute right-3 top-1/2 transform -translate-y-1/2" ]
                        [ div [ class "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" ] []
                        ]
                  else
                    text ""
                ]
            , div [ class "flex gap-2 mt-2 sm:mt-0" ]
                [ button 
                    [ onClick Search
                    , class "flex-1 sm:flex-initial bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
                    , disabled model.isSearching
                    ] 
                    [ text "Search" ]
                , button 
                    [ onClick Clear
                    , class "flex-1 sm:flex-initial bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
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
            if model.isSearching && List.isEmpty model.tweets then
                div [ class "text-gray-500 p-4 text-center" ] 
                    [ div [ class "flex items-center justify-center gap-2" ]
                        [ div [ class "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" ] []
                        , text "Searching..."
                        ]
                    ]
            else if String.trim model.query /= "" && List.isEmpty model.tweets && not model.isSearching then
                div [ class "text-gray-500 p-4 text-center" ] 
                    [ text "No tweets found for your search." ]
            else
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
