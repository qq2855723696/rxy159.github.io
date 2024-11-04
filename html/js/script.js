/**
 * Global variabless
 */
"use strict";

var userAgent = navigator.userAgent.toLowerCase(),
		initialDate = new Date(),
		$html = $('html'),
		isIE = (userAgent.indexOf('msie') != -1) ? parseInt(userAgent.split('msie')[1], 10) : false,
		isDesktop = $html.hasClass('desktop'),
		isTouch = "ontouchstart" in window,
		plugins = {
			pointerEvents: isIE && isIE < 11 ? 'js/pointer-events.min.js' : false,
			tooltip: $('[data-toggle="tooltip"]'),
			search: $('.rd-navbar-search'),
			navTabs: $('.nav-tabs'),
			navbar: $('.rd-navbar'),
			statefulButton: $('.btn-stateful'),
			isotope: $(".isotope"),
			rdMailForm: $(".rd-mailform"),
			rdInputLabel: $(".form-label"),
			regula: $("[data-constraints]"),
			radio: $("input[type='radio']"),
			checkbox: $("input[type='checkbox']"),
			captcha: $('.recaptcha'),
			maps: $(".google-map-container")
		},
		$year = $("#copyright-year"),
		$document = $(document),
		isNoviBuilder = false,
		$window = $(window),
		i = 0;

/**
 * @desc Check the element was been scrolled into the view
 * @param {object} elem - jQuery object
 * @return {boolean}
 */
function isScrolledIntoView(elem) {
	if (isNoviBuilder) return true;
	return elem.offset().top + elem.outerHeight() >= $window.scrollTop() && elem.offset().top <= $window.scrollTop() + $window.height();
}

/**
 * @desc Calls a function when element has been scrolled into the view
 * @param {object} element - jQuery object
 * @param {function} func - init function
 */
function lazyInit(element, func) {
	var scrollHandler = function () {
		if (( !element.hasClass('lazy-loaded') && ( isScrolledIntoView(element) ) )) {
			func.call();
			element.addClass('lazy-loaded');
		}
	};

	scrollHandler();
	$window.on('scroll', scrollHandler);
}

/**
 * Initialize All Scripts
 */
$document.ready(function () {
	var isNoviBuilder = window.xMode;

	/**
	 * @desc Google map function for getting latitude and longitude
	 */
	function getLatLngObject(str, marker, map, callback) {
		var coordinates = {};
		try {
			coordinates = JSON.parse(str);
			callback(new google.maps.LatLng(
					coordinates.lat,
					coordinates.lng
			), marker, map)
		} catch (e) {
			map.geocoder.geocode({'address': str}, function (results, status) {
				if (status === google.maps.GeocoderStatus.OK) {
					var latitude = results[0].geometry.location.lat();
					var longitude = results[0].geometry.location.lng();

					callback(new google.maps.LatLng(
							parseFloat(latitude),
							parseFloat(longitude)
					), marker, map)
				}
			})
		}
	}

	/**
	 * attachFormValidator
	 * @description  attach form validation to elements
	 */
	function attachFormValidator(elements) {
		for (var i = 0; i < elements.length; i++) {
			var o = $(elements[i]), v;
			o.addClass("form-control-has-validation").after("<span class='form-validation'></span>");
			v = o.parent().find(".form-validation");
			if (v.is(":last-child")) {
				o.addClass("form-control-last-child");
			}
		}

		elements
		.on('input change propertychange blur', function (e) {
			var $this = $(this), results;

			if (e.type !== "blur") {
				if (!$this.parent().hasClass("has-error")) {
					return;
				}
			}

			if ($this.parents('.rd-mailform').hasClass('success')) {
				return;
			}

			if ((results = $this.regula('validate')).length) {
				for (i = 0; i < results.length; i++) {
					$this.siblings(".form-validation").text(results[i].message).parent().addClass("has-error")
				}
			} else {
				$this.siblings(".form-validation").text("").parent().removeClass("has-error")
			}
		})
		.regula('bind');

		var regularConstraintsMessages = [
			{
				type: regula.Constraint.Required,
				newMessage: "The text field is required."
			},
			{
				type: regula.Constraint.Email,
				newMessage: "The email is not a valid email."
			},
			{
				type: regula.Constraint.Numeric,
				newMessage: "Only numbers are required"
			},
			{
				type: regula.Constraint.Selected,
				newMessage: "Please choose an option."
			}
		];


		for (var i = 0; i < regularConstraintsMessages.length; i++) {
			var regularConstraint = regularConstraintsMessages[i];

			regula.override({
				constraintType: regularConstraint.type,
				defaultMessage: regularConstraint.newMessage
			});
		}
	}

	/**
	 * isValidated
	 * @description  check if all elemnts pass validation
	 */
	function isValidated(elements, captcha) {
		var results, errors = 0;
		var j, k;

		if (elements.length) {
			for (j = 0; j < elements.length; j++) {

				var $input = $(elements[j]);
				if ((results = $input.regula('validate')).length) {
					for (k = 0; k < results.length; k++) {
						errors++;
						$input.siblings(".form-validation").text(results[k].message).parent().addClass("has-error");
					}
				} else {
					$input.siblings(".form-validation").text("").parent().removeClass("has-error")
				}
			}

			if (captcha) {
				if (captcha.length) {
					return validateReCaptcha(captcha) && errors === 0
				}
			}

			return errors === 0;
		}
		return true;
	}

	/**
	 * validateReCaptcha
	 * @description  validate google reCaptcha
	 */
	function validateReCaptcha(captcha) {
		var captchaToken = captcha.find('.g-recaptcha-response').val();

		if (captchaToken.length === 0) {
			captcha
			.siblings('.form-validation')
			.html('Please, prove that you are not robot.')
			.addClass('active');
			captcha
			.closest('.form-group')
			.addClass('has-error');

			captcha.on('propertychange', function () {
				var $this = $(this),
						captchaToken = $this.find('.g-recaptcha-response').val();

				if (captchaToken.length > 0) {
					$this
					.closest('.form-group')
					.removeClass('has-error');
					$this
					.siblings('.form-validation')
					.removeClass('active')
					.html('');
					$this.off('propertychange');
				}
			});

			return false;
		}

		return true;
	}

	/**
	 * onloadCaptchaCallback
	 * @description  init google reCaptcha
	 */
	window.onloadCaptchaCallback = function () {
		for (i = 0; i < plugins.captcha.length; i++) {
			var $capthcaItem = $(plugins.captcha[i]);

			grecaptcha.render(
					$capthcaItem.attr('id'),
					{
						sitekey: $capthcaItem.attr('data-sitekey'),
						size: $capthcaItem.attr('data-size') ? $capthcaItem.attr('data-size') : 'normal',
						theme: $capthcaItem.attr('data-theme') ? $capthcaItem.attr('data-theme') : 'light',
						callback: function (e) {
							$('.recaptcha').trigger('propertychange');
						}
					}
			);
			$capthcaItem.after("<span class='form-validation'></span>");
		}
	};

	/**
	 * Google ReCaptcha
	 * @description Enables Google ReCaptcha
	 */
	if (plugins.captcha.length) {
		$.getScript("//www.google.com/recaptcha/api.js?onload=onloadCaptchaCallback&render=explicit&hl=en");
	}

	/**
	 * Radio
	 * @description Add custom styling options for input[type="radio"]
	 */
	if (plugins.radio.length) {
		var i;
		for (i = 0; i < plugins.radio.length; i++) {
			$(plugins.radio[i]).addClass("radio-custom").after("<span class='radio-custom-dummy'></span>")
		}
	}

	/**
	 * Checkbox
	 * @description Add custom styling options for input[type="checkbox"]
	 */
	if (plugins.checkbox.length) {
		var i;
		for (i = 0; i < plugins.checkbox.length; i++) {
			$(plugins.checkbox[i]).addClass("checkbox-custom").after("<span class='checkbox-custom-dummy'></span>")
		}
	}

	/**
	 * RD Input Label
	 * @description Enables RD Input Label Plugin
	 */
	if (plugins.rdInputLabel.length) {
		plugins.rdInputLabel.RDInputLabel();
	}

	/**
	 * Regula
	 * @description Enables Regula plugin
	 */
	if (plugins.regula.length) {
		attachFormValidator(plugins.regula);
	}

	/**
	 * RD Mailform
	 * @version      3.2.0
	 */
	if (plugins.rdMailForm.length) {
		var i, j, k,
				msg = {
					'MF000': 'Successfully sent!',
					'MF001': 'Recipients are not set!',
					'MF002': 'Form will not work locally!',
					'MF003': 'Please, define email field in your form!',
					'MF004': 'Please, define type of your form!',
					'MF254': 'Something went wrong with PHPMailer!',
					'MF255': 'Aw, snap! Something went wrong.'
				};

		for (i = 0; i < plugins.rdMailForm.length; i++) {
			var $form = $(plugins.rdMailForm[i]),
					formHasCaptcha = false;

			$form.attr('novalidate', 'novalidate').ajaxForm({
				data: {
					"form-type": $form.attr("data-form-type") || "contact",
					"counter": i
				},
				beforeSubmit: function (arr, $form, options) {
					if (isNoviBuilder)
						return;

					var form = $(plugins.rdMailForm[this.extraData.counter]),
							inputs = form.find("[data-constraints]"),
							output = $("#" + form.attr("data-form-output")),
							captcha = form.find('.recaptcha'),
							captchaFlag = true;

					output.removeClass("active error success");

					if (isValidated(inputs, captcha)) {

						// veify reCaptcha
						if (captcha.length) {
							var captchaToken = captcha.find('.g-recaptcha-response').val(),
									captchaMsg = {
										'CPT001': 'Please, setup you "site key" and "secret key" of reCaptcha',
										'CPT002': 'Something wrong with google reCaptcha'
									};

							formHasCaptcha = true;

							$.ajax({
								method: "POST",
								url: "bat/reCaptcha.php",
								data: {'g-recaptcha-response': captchaToken},
								async: false
							})
							.done(function (responceCode) {
								if (responceCode !== 'CPT000') {
									if (output.hasClass("snackbars")) {
										output.html('<p><span class="icon text-middle fa fa-check icon-xxs"></span><span>' + captchaMsg[responceCode] + '</span></p>')

										setTimeout(function () {
											output.removeClass("active");
										}, 3500);

										captchaFlag = false;
									} else {
										output.html(captchaMsg[responceCode]);
									}

									output.addClass("active");
								}
							});
						}

						if (!captchaFlag) {
							return false;
						}

						form.addClass('form-in-process');

						if (output.hasClass("snackbars")) {
							output.html('<p><span class="icon text-middle fa fa-circle-o-notch fa-spin icon-xxs"></span><span>Sending</span></p>');
							output.addClass("active");
						}
					} else {
						return false;
					}
				},
				error: function (result) {
					if (isNoviBuilder)
						return;

					var output = $("#" + $(plugins.rdMailForm[this.extraData.counter]).attr("data-form-output")),
							form = $(plugins.rdMailForm[this.extraData.counter]);

					output.text(msg[result]);
					form.removeClass('form-in-process');

					if (formHasCaptcha) {
						grecaptcha.reset();
					}
				},
				success: function (result) {
					if (isNoviBuilder)
						return;

					var form = $(plugins.rdMailForm[this.extraData.counter]),
							output = $("#" + form.attr("data-form-output")),
							select = form.find('select');

					form
					.addClass('success')
					.removeClass('form-in-process');

					if (formHasCaptcha) {
						grecaptcha.reset();
					}

					result = result.length === 5 ? result : 'MF255';
					output.text(msg[result]);

					if (result === "MF000") {
						if (output.hasClass("snackbars")) {
							output.html('<p><span class="icon text-middle fa fa-check icon-xxs"></span><span>' + msg[result] + '</span></p>');
						} else {
							output.addClass("active success");
						}
					} else {
						if (output.hasClass("snackbars")) {
							output.html(' <p class="snackbars-left"><span class="icon icon-xxs fa fa-exclamation-triangle text-middle"></span><span>' + msg[result] + '</span></p>');
						} else {
							output.addClass("active error");
						}
					}

					form.clearForm();

					if (select.length) {
						select.select2("val", "");
					}

					form.find('input, textarea').trigger('blur');

					setTimeout(function () {
						output.removeClass("active error success");
						form.removeClass('success');
					}, 3500);
				}
			});
		}
	}

	/**
	 * @module       Set current year
	 */
	if ($year.length) {
		$year.text(initialDate.getUTCFullYear());
	}

	/**
	 * @module       IE Polyfills
	 * @description  Adds some loosing functionality to IE browsers
	 */
	if (isIE) {
		if (plugins.pointerEvents) {
			$.getScript(plugins.pointerEvents)
			.done(function () {
				$html.addClass('lt-ie-11');
				PointerEventsPolyfill.initialize({});
			});
		}
		if (isIE < 10) {
			$html.addClass('lt-ie-10');
		}
	}

	/**
	 * @module       Bootstrap Tooltips
	 * @author       Jason Frame
	 * @version      3.3.6
	 * @license      MIT License
	 * @link         https://github.com/twbs/bootstrap/blob/master/js/tooltip.js
	 */
	if (plugins.tooltip.length) {
		for (i = 0; i < plugins.tooltip.length; i++) {
			var tooltipItem = plugins.tooltip[i];
			$(tooltipItem).tooltip();
		}
	}

	/**
	 * @module       RD Toggles
	 * @author       Aleksey Patsurvkoskiy
	 * @version      0.2.1
	 * @license      MIT License
	 * @link         http://cms.devoffice.com/coding-demo/mnemon1k/rd-toggle/demo/
	 */
	if ($.length) {
		$.RDToggles();
	}

	/**
	 * @module      Buttons
	 * @author      Twitter, Inc.
	 * @version     3.3.6
	 * @link        https://github.com/twbs/bootstrap/blob/master/js/button.js
	 * @license     MIT License
	 */
	if (plugins.statefulButton.length) {
		$(plugins.statefulButton).on('click', function () {
			var statefulButtonLoading = $(this).button('loading');

			setTimeout(function () {
				statefulButtonLoading.button('reset')
			}, 2000);
		})
	}

	/**
	 * @module       UIToTop
	 * @author       Matt Varone
	 * @see          http://www.mattvarone.com/web-design/uitotop-jquery-plugin/
	 * @license      MIT License
	 */
	if (isDesktop && !isNoviBuilder) {
		$().UItoTop({
			easingType: 'easeOutQuart',
			containerClass: 'ui-to-top fl-bigmug-line-up98'
		});
	}

	/**
	 * @module       RD Navbar
	 * @author       Evgeniy Gusarov
	 * @see          https://ua.linkedin.com/pub/evgeniy-gusarov/8a/a40/54a
	 * @version      2.1.3
	 */
	if (plugins.navbar.length) {
		plugins.navbar.RDNavbar({
			stickUpClone: false,
			stickUpOffset: 70
		});
	}

	/**
	 * @module       Search Plugin
	 * @version      1.0.0
	 * @author       Evgeniy Gusarov (Stmechanus | Diversant)
	 * @license      The MIT License (MIT)
	 */
	if (plugins.search.length) {
		for (i = 0; plugins.search.length; i++) {
			var searchItem = plugins.search[i];
			$(searchItem).RDSearch({});
		}
	}

	/**
	 * @module       WOW
	 * @author       Matthieu Aussaguel
	 * @license      MIT License
	 * @version      1.1.2
	 * @link         https://github.com/matthieua/WOW
	 */
	if (isDesktop && $html.hasClass("wow-animation") && $(".wow").length) {
		new WOW().init();
	}

	/**
	 * @module       Bootstrap tabs
	 * @author       Twitter, Inc.
	 * @license      MIT License
	 * @version      3.3.6
	 * @link         https://github.com/twbs/bootstrap/blob/master/js/tab.js
	 */
	if (plugins.navTabs.length) {
		for (i = 0; i < plugins.navTabs.length; i++) {
			var navTabsItem = plugins.navTabs[i];

			$(navTabsItem).add("#tabs-2").on("click", "a", function (event) {
				event.preventDefault();
				$(this).tab('show');
			});
		}
	}

});
$(window).load(function () {
	function doSetTimeout(elem) {
		setTimeout(function () {
			elem.className += " isotope--loaded";
		}, 600);
	}

	if (plugins.isotope.length) {
		for (i = 0; i < plugins.isotope.length; i++) {
			var isotopeItem = plugins.isotope[i]
					, iso = new Isotope(isotopeItem, {
				itemSelector: '[class*="col-"], .isotope-item',
				layoutMode: isotopeItem.getAttribute('data-isotope-layout') ? isotopeItem.getAttribute('data-isotope-layout') : 'masonry'
			});
			iso.layout();
			doSetTimeout(isotopeItem);
		}
	}
});