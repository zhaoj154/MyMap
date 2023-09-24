<template>
  <div>
    <section class="ui two column centered grid" style="position:relative;z-index:1">
      <div class="column">
        <form class="ui segment large form">
          <div class="ui message red" v-show="error">{{error}}</div>
          <div class="ui segment">
            <div class="field">
              <div class="ui right icon input large">
                <input
                  type="text"
                  placeholder="Enter your address"
                  v-model="address"
                  ref="autocomplete"
                />
                <i class="map pin link icon" @click="getCurrentPosition"></i>
              </div>
            </div>
            <div class="field">
              <div class="ui right icon input large segment timezone" >{{timezone}}
              </div>
            </div>
            <div class="field">
              <div class="ui right icon input large segment timezone" >{{localDate}}
              </div>
            </div>
            
            <button class="ui button link search" @click="getAddressByText">Search</button>
          </div>
        </form>
      </div>
    </section>
    
    <div class="ui segment" style="position:absolute;z-index:1" v-show="addressList.length != 0">
      <div class="">
        <div class="ui button removeAddresses" @click="removeAddresses">
          <i class="archive link icon"></i>
        </div>
        <div class="ui button page">
          Page {{this.pageNumber+1}}
        </div>
        <div class="ui button page" @click="prevPage">
          <i class="angle left link icon" ></i>
        </div>
        <div class="ui button page" @click="nextPage">
          <i class="angle right link icon" ></i>
        </div>
      </div>
      
      
      <div v-for="item in paginatedData()" class="ui segment">
        <input type="checkbox" v-model="item.checked"/>
        <label for="checkbox">{{item.address}}</label>
      </div>
      

    </div>

    <section id="map" ref="map">{{map}}</section>
  </div>
</template>
  
<script>
import axios from "axios";
  export default {
    data() {
        return {
            addressList: [],
            address: "",
            error: "",
            timezone: "",
            timezoneId: "",
            checked: false,
            pageNumber: 0,
            pageSize: 10,
            localDate: null,
            timer: '',
            map: {}
        }
    },

    mounted() {
      this.timer = setInterval(this.updateTime, 1000);
      new google.maps.Map(this.$refs["map"], {
        zoom: 8,
        center: new google.maps.LatLng(-34.397, 150.644),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      });

      this.getTimeZone(-34.397, 150.644)

      
    },

    beforeDestroy() {
      clearInterval(this.timer);
    },

    methods: {
      //main function of get current position
      getCurrentPosition() {
        this.error = ""
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    //display full address on bar
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    this.getAddressByLatLon(lat, lng);
                    // this.getTimeZone(position.coords.latitude, position.coords.longitude)
                    
                },
                (error) => {
                  this.error = error.message;
                }
            );
        } else {
          this.error = "Your browser does not support geolocation API ";
        }
      },

      //main function of get address position
      getAddressByText() {
        this.error = ""
        if(this.address == ""){
          this.error = "Please enter your address"
        }else{
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: this.address })
          .then((response) => {
            this.address = response.results[0].formatted_address;
            
            var lat = response.results[0].geometry.location.lat()
            var lng = response.results[0].geometry.location.lng()
            this.showLocationOnTheMap(lat, lng, response.results[0].formatted_address);
          })
          .catch((error) => {
            this.error = error.message;
          })
        }
      },

      //main function of remove selected address
      removeAddresses() {
        for (let i = 0; i < this.addressList.length; i++) {
          if(this.addressList[i].checked == true){
            this.addressList[i].marker.setMap(null);
          }
        }

        this.addressList = this.addressList.filter(item => item.checked === false)
        this.pageNumber = 0
      },

      //helper function of get address name by latlon
      getAddressByLatLon(lat, lng) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: {lat: lat, lng: lng} })
        .then((response) => {
          if (response.results[0]) {
            this.address = response.results[0].formatted_address;

            //show location on map
            this.showLocationOnTheMap(lat, lng, response.results[0].formatted_address);
          } else {
            this.error = "No results found";
          }
        })
        .catch((error) => {
          this.error = error.message;
        })
      },

      //helper function of show location on map by latlon
      showLocationOnTheMap(latitude, longitude, address) {
        var map = new google.maps.Map(this.$refs["map"], {
          zoom: 8,
          center: new google.maps.LatLng(latitude, longitude),
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });
        this.getTimeZone(latitude, longitude)

        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(latitude, longitude),
          map,
        });
        this.addressList.push({address: address, marker: marker, checked: false});

        for (let i = 0; i < this.addressList.length; i++) {
          this.addressList[i].marker.setMap(map);
        }
      },

      //helper function of show timezone
      getTimeZone(latitude, longitude){
        const timestamp = Math.floor(Date.now() / 1000)
        axios.get(`https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=AIzaSyDG5YJEWj154kGfvisq3BXwWY-zSeEWIlU`)
        .then((response) => {
            if(response.data.timeZoneName){
              this.timezone = "Timezone: " + response.data.timeZoneName
              this.timeZoneId = response.data.timeZoneId
              var date = new Date(Date.now())
              this.localDate = "Local Time: " + date.toLocaleString('en-US', { timeZone: response.data.timeZoneId })
            }
          }
        )
      },

      nextPage(){
        if(this.pageNumber < Math.floor(this.addressList.length/this.pageSize)){
          this.pageNumber++;
        }
      },
      prevPage(){
        if(this.pageNumber > 0){
          this.pageNumber--;
        }
      },

      paginatedData(){
          var start = this.pageNumber * this.pageSize
          var end = start + this.pageSize;
          return this.addressList.slice(start, end);
      },

      updateTime() {
        if(this.localDate){
          var date = new Date(Date.now())
          this.localDate = "Local Time: " + date.toLocaleString('en-US', { timeZone: this.timeZoneId })
        }
      }
    },

  };
  </script>
  
<style>
.ui.button.search,.map.pin.icon {
background-color: #5299c9;
color: white;
}

.ui.button.removeAddresses {
  background-color: #f06850;
  color: white;
  align-items: center;
}

.ui.button.page {
  background-color: #706e6e;
  color: white;
  align-items: center;
}

.archive.icon,.angle.left.icon,.angle.right.icon{
  margin: auto !important;
}

.timezone{
  min-height: 55px;
  max-height: 55px;
}

#map {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

#history {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
</style>
  
  
  
  