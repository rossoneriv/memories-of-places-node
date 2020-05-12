let dynamicMap = (function(){
    
    var markers = [];
    let loadedMarker = [];

    function onSuccessGeolocation(position){
        var moveLatLon = new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.panTo(moveLatLon); 
        map.setLevel(4);
    }
    function onErrorGeolocation(){
    }

    function placesSearchCB(data, status, pagination) {
        if (status === kakao.maps.services.Status.OK) {
            displayPlaces(data);
            displayPagination(pagination);
        } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
            alert('검색 결과가 존재하지 않습니다.');
            return;
        } else if (status === kakao.maps.services.Status.ERROR) {
            alert('검색 결과 중 오류가 발생했습니다.');
            return;
        }
    }

    function displayPlaces(places) {
        var listEl = document.getElementById('placesList'), 
        menuEl = document.getElementById('menu_wrap'),
        fragment = document.createDocumentFragment(), 
        bounds = new kakao.maps.LatLngBounds(), 
        listStr = '';
        
        removeAllChildNods(listEl);
        removeMarker();
        
        for ( var i=0; i<places.length; i++ ) {
            var placePosition = new kakao.maps.LatLng(places[i].y, places[i].x),
                marker = addMarker(placePosition, i), 
                itemEl = getListItem(i, places[i]);
            bounds.extend(placePosition);

            (function(marker, title) {
                kakao.maps.event.addListener(marker, 'mouseover', function() {
                    displayInfowindow(marker, title);
                });
                kakao.maps.event.addListener(marker, 'mouseout', function() {
                    infowindow.close();
                });
                kakao.maps.event.addListener(marker, 'click', () => {
                    registerMemories(marker, title);
                });
                itemEl.onmouseover =  function () {
                    displayInfowindow(marker, title);
                };
                itemEl.onmouseout =  function () {
                    infowindow.close();
                };
                itemEl.onclick = () => {
                    registerMemories(marker, title);
                };
            })(marker, places[i].place_name);
            fragment.appendChild(itemEl);
        }
        listEl.appendChild(fragment);
        menuEl.scrollTop = 0;
        map.setBounds(bounds);
    }

    function getListItem(index, places) {
        var el = document.createElement('li'),
        itemStr = '<span class="markerbg marker_' + (index+1) + '"></span>' +
                    '<div class="info">' +
                    '   <h5>' + places.place_name + '</h5>';
        if (places.road_address_name) {
            itemStr += '    <span>' + places.road_address_name + '</span>' +
                        '   <span class="jibun gray">' +  places.address_name  + '</span>';
        } else {
            itemStr += '    <span>' +  places.address_name  + '</span>'; 
        }  
        itemStr += '  <span class="tel">' + places.phone  + '</span>' +
                    '</div>';           
        el.innerHTML = itemStr;
        el.className = 'item';
    
        return el;
    }
    
    function addMarker(position, idx, title) {
        var imageSrc = 'http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png',
            imageSize = new kakao.maps.Size(36, 37),
            imgOptions =  {
                spriteSize : new kakao.maps.Size(36, 691),
                spriteOrigin : new kakao.maps.Point(0, (idx*46)+10),
                offset: new kakao.maps.Point(13, 37)
            },
            markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions),
            marker = new kakao.maps.Marker({
                position: position,
                image: markerImage 
            });
    
        marker.setMap(map);
        markers.push(marker);
    
        return marker;
    }

    function removeMarker() {
        for ( var i = 0; i < markers.length; i++ ) {
            markers[i].setMap(null);
        }   
        markers = [];
    }
    
    function displayPagination(pagination) {
        var paginationEl = document.getElementById('pagination'),
            fragment = document.createDocumentFragment(),
            i; 
    
        while (paginationEl.hasChildNodes()) {
            paginationEl.removeChild (paginationEl.lastChild);
        }
    
        for (i=1; i<=pagination.last; i++) {
            var el = document.createElement('a');
            el.href = "#";
            el.innerHTML = i;
    
            if (i===pagination.current) {
                el.className = 'on';
            } else {
                el.onclick = (function(i) {
                    return function() {
                        pagination.gotoPage(i);
                    }
                })(i);
            }
    
            fragment.appendChild(el);
        }
        paginationEl.appendChild(fragment);
    }

    function displayInfowindow(marker, title) {
        var content = '<div style="padding:5px;z-index:1;">' + title + '</div>';
    
        infowindow.setContent(content);
        infowindow.open(map, marker);
    }
    
    function removeAllChildNods(el) {   
        while (el.hasChildNodes()) {
            el.removeChild (el.lastChild);
        }
    }

    function registerMemories(marker, place) {
        const geocoder = new kakao.maps.services.Geocoder();
        let keyArr = '';
        geocoder.coord2Address(marker.getPosition().Ga, marker.getPosition().Ha, (result, status) => {
            if(status === kakao.maps.services.Status.OK) {
                keyArr = `${result[0].address.region_1depth_name}_${result[0].address.region_2depth_name}_${result[0].address.region_3depth_name}`;
            }

            registerModal.getRegisterModal({
                marker: marker,
                place: place,
                keyArr: keyArr // getAddresskeyword(marker.getPosition().Ha, marker.getPosition().Ga)
            }, true);
        });
    }

    function _getSavedPlaceMarker(data){
        if(data.length > 0){
            const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
            const imageSize = new kakao.maps.Size(24, 35);
            const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);
            const bounds = new kakao.maps.LatLngBounds();

            for(let i=0; i<data.length; i++) {
                var marker = new kakao.maps.Marker({
                    map: map,
                    position: new kakao.maps.LatLng(Number(data[i].lat), Number(data[i].lon)),
                    title : data[i].place,
                    image : markerImage
                });
                dynamicMap.loadedMarker.push(marker);
                bounds.extend(new kakao.maps.LatLng(Number(data[i].lat), Number(data[i].lon)));

                kakao.maps.event.addListener(marker, 'click', function() {
                    memoryModal.getMemoryModal(this);
                }.bind(data[i]));

                const infowindow = new kakao.maps.InfoWindow({
                    content: _getInfoWindow(data[i])
                });
                kakao.maps.event.addListener(marker, 'mouseover', function() {
                    this.infowindow.open(map, this.marker);
                }.bind({...data[i], infowindow, marker}));

                kakao.maps.event.addListener(marker, 'mouseout', function() {
                    this.infowindow.close();
                }.bind({...data[i], infowindow}));
            }
            map.setBounds(bounds);
        } else {
            if(navigator.geolocation){
                navigator.geolocation.getCurrentPosition(onSuccessGeolocation, onErrorGeolocation);
            }
        }
    }

    function _getInfoWindow(data) {
        html = `
        <div class="row">
            <img src=${data.path} style="max-width: 148px;" class="img-thumbnail" alt="Cinque Terre">
        </div>
        `;
        return html;
    }

    return {
        searchPlaces: function(){
            var keyword = document.getElementById('keyword').value;
            if (!keyword.replace(/^\s+|\s+$/g, '')) {
                alert('키워드를 입력해주세요!');
                return false;
            }
            placeService.keywordSearch(keyword, placesSearchCB);
        },

        getSavedPlaceMarker: function(data){
            _getSavedPlaceMarker(data);
        },

        loadedMarker: []
    }
})();