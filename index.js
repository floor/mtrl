// base classes
import Control from './src/class/control'
import Component from './src/class/component'
// components
import AppBar from './src/appbar'
import Badge from './src/badge'
import Button from './src/button'
import Card from './src/card'
import Checkbox from './src/checkbox'
import ColorPicker from './src/colorpicker'
import DateHour from './src/datehour'
import Dialog from './src/dialog'
import Drawer from './src/drawer'
import Element from './src/element'
import File from './src/file'
import Form from './src/form'
import Image from './src/image'
import List from './src/list'
import Loading from './src/loading'
import Menu from './src/menu'
import Navigation from './src/navigation'
import Progress from './src/progress'
import Select from './src/select'
import Selecter from './src/selecter'
import Snackbar from './src/snackbar'
import Slider from './src/slider'
import Switch from './src/switch'
import Switcher from './src/switcher'
import Tabs from './src/tabs'
import TabView from './src/tabview'
import Text from './src/text'
import Textfield from './src/textfield'
import Toolbar from './src/toolbar'
import Tooltip from './src/tooltip'
import View from './src/view'
import attributes from './src/module/attributes'
// mixins
import EventEmitter from './src/mixin/emitter'
import display from './src/mixin/display'
import build from './src/mixin/build'
import position from './src/mixin/position'
// modules
import clone from './src/module/clone'
import dataset from './src/module/dataset'
import device from './src/module/device'
import emitter from './src/module/emitter'
import events from './src/module/events'
import jsonToHTML from './src/module/jsontohtml'
import { create } from './src/module/layout'
import mediator from './src/module/mediator'
import merge from './src/module/merge'
import observer from './src/module/observer'
import request from './src/module/request'
import ripple from './src/module/ripple'
import smoothscroll from './src/module/smoothscroll'
import touch from './src/module/touch'

export {
  // classes
  Component, Control,
  AppBar, Button, Card, Checkbox, DateHour, Dialog, Drawer, Element,
  File, Form, Image, List, Loading, Menu, Navigation, Progress, Select,
  Selecter, Slider, Snackbar, Switch, Switcher, Tabs, TabView, Text, Textfield, Toolbar, Tooltip,
  View,
  // mixins and  modules
  EventEmitter,
  attributes, build, clone, create, dataset, device, display, events, emitter, jsonToHTML, mediator, merge,
  observer, position, request, ripple, smoothscroll, touch
}
