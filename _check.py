import re, collections, sys

html = open('index.html', encoding='utf-8').read()

clean = re.sub(r'<script[\s\S]*?</script>', '', html, flags=re.I)
clean = re.sub(r'<style[\s\S]*?</style>', '', clean, flags=re.I)
clean = re.sub(r'<!--[\s\S]*?-->', '', clean)

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
tags = re.findall(r'<(/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(/?)>', clean)
opens = collections.Counter(); closes = collections.Counter()
for slash, name, attrs, selfclose in tags:
    n = name.lower()
    if n in VOID or selfclose:
        continue
    (closes if slash else opens)[n] += 1

bad = {t: (opens[t], closes[t]) for t in set(opens) | set(closes) if opens[t] != closes[t]}
print("=== STRUCTURE ===")
print("UNBALANCED:", bad if bad else "none - all paired tags balanced")
print("tag totals:", sum(opens.values()), "open /", sum(closes.values()), "close")

css = open('styles.css', encoding='utf-8').read()
print("\n=== CSS ===")
print("braces:", css.count('{'), "{ /", css.count('}'), "}")
print("parens:", css.count('('), "( /", css.count(')'), ")")
print("balanced:", css.count('{') == css.count('}') and css.count('(') == css.count(')'))

print("\n=== FUNCTIONAL ===")
ids = ['top','about','services','work','why','process','testimonials','faq','contact']
found = [i for i in ids if 'id="%s"' % i in html]
print("sections present: %d/9 -> %s" % (len(found), found))

imgs = re.findall(r'<img[^>]*src="(images/[^"]+)"', html)
print("local images referenced: %d -> %s" % (len(imgs), sorted(set(imgs))))

def count(s):
    return html.count(s)

print("work gallery items: %d (expect 6)" % count('class="work__item'))
print("service cards: %d (expect 6)" % count('class="svc reveal"'))
print("why cards: %d (expect 6)" % count('class="why__card'))
print("process steps: %d (expect 5)" % count('class="step reveal"'))
print("testimonials: %d (expect 3)" % count('class="quote reveal"'))
print("faq items: %d (expect 6)" % count('class="faq__item'))
print("form controls: %d" % len(re.findall(r'<(input|select|textarea)', html)))
print("mailto wired:", 'mailto:hello@teamwireframe.studio' in html)
print("whatsapp links: %d" % count('wa.me/'))
print("behance link:", 'behance.net/teamwireframe_' in html)
print("lightbox present:", 'id="lightbox"' in html)
print("reveal elements: %d" % count('class="reveal"'))
print("title:", re.search(r'<title>(.*?)</title>', html).group(1)[:75])

hrefs = set(re.findall(r'href="#([^"]+)"', html))
missing = [h for h in hrefs if 'id="%s"' % h not in html]
print("\nanchor targets: %d -> missing: %s" % (len(hrefs), missing if missing else 'none'))

# CSS class coverage: every class used in HTML should exist in CSS (spot obvious typos)
html_classes = set()
for attr in re.findall(r'class="([^"]+)"', html):
    for c in attr.split():
        html_classes.add(c)
css_classes = set(re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', css))
unstyled = sorted(c for c in html_classes if c not in css_classes and not c.startswith('is-'))
print("HTML classes with no CSS rule: %s" % (unstyled if unstyled else 'none'))
